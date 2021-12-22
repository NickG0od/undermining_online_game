const {Router} = require('express')
const router = Router()
const { mongo } = require('mongoose')
const fs = require('fs')
const utils = require('../utils')
const multer = require('multer'); 

const Room = require('../models/Room')
const Player = require('../models/Player')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname+'-'+Date.now()+'.png')
    }
})
const upload = multer({storage: storage})


router.get('/', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    const room = await Room.where({id: roomID}).findOne();
    let playersList = []; let roomCode = "";
    let isInRoom = false; let isPlayerHost = false;
    if (room) {
        playersList = await Player.find({roomId: roomID}).lean();
        if (playersList.length < 2) {
            try {
                await Player.updateOne({id: playerID}, {$set: {roomId: roomID}});
            } catch (e) {console.log(e)}
        }
        isInRoom = true;
        isPlayerHost = room.hostId == playerID;
        roomCode = room.code;
    }
    res.render('index', {
        title: 'Undermining Online',
        isInRoom: isInRoom,
        players: playersList,
        roomCode: roomCode,
        isPlayerHost: isPlayerHost,
    })
});

router.get('/get_players_in_room', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    const players = await Player.find({roomId: roomID}).lean();
    let status = "";
    if (players.length >= 2) {status = "ok";}
    for (let i = 0; i < players.length; i++) {
        players[i]['current'] = playerID == players[i]['id'];
    }
    let sendData = {status, players};
    res.send(sendData);
});

router.get('/get_room_status', async (req, res) => {
    const roomID = req.cookies.roomID;
    const room = await Room.where({id: roomID}).findOne();
    let status = ""; let data = {};
    if (room) {
        data = room.data;
        if (room.data.startedStatus == 1) {status = "ok";}
    } else {status = "err";}
    let sendData = {status, data};
    res.send(sendData);
});

router.get('/get_game', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    const room = await Room.where({id: roomID}).findOne();
    let status = ""; let fields = []; let playerMove = -1; let playerInd = -1;
    let loseId = null;
    if (room) {
        let tmpFields = room.data.fields;
        for (let i = 0; i < tmpFields.length; i++) {
            if (tmpFields[i].playerId == playerID) {
                playerMove = tmpFields[i].move;
                playerInd = i;
            }
            fields.push(
                {usedFlags: tmpFields[i].usedFlags, explodedBombs: tmpFields[i].explodedBombs, 
                watchField: tmpFields[i].watchField}
            );
            if (tmpFields[i].explodedBombs >= room.data.winGoal) {
                loseId = tmpFields[i].playerId;
            }
        }
        status = "ok";
    } else {status = "err";}
    let sendData = {status, fields, playerMove, playerInd, loseId};
    res.send(sendData);
});

router.post('/room_login', async (req, res) => {
    let roomCode = req.body.roomCode;
    let playerName = req.body.playerName;
    let tmpRoomId = utils.makeCode(64);
    let tmpRoomCode = utils.makeCode(8);
    let tmpPlayerId = utils.makeCode(16);
    if (!roomCode || roomCode == "") {
        const room = Room({
            id: tmpRoomId,
            code: tmpRoomCode,
            hostId: tmpPlayerId,
            data: {startedStatus: 0, fieldSize: 8, bombsCount: 10, winGoal: 4, flags: 6, fields: []},
        });
        await room.save();
        roomCode = tmpRoomCode;
    }
    const room = await Room.where({ code: roomCode }).findOne();
    if (room) {
        const player = Player({
            id: tmpPlayerId,
            name: playerName,
            roomId: "null",
        });
        await player.save();
        res.cookie('roomID', room.id, {maxAge: 900000, httpOnly: true});
        res.cookie('playerID', tmpPlayerId, {maxAge: 900000, httpOnly: true});
    }
    res.redirect('/');
});

router.post('/set_room_vars', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    const cId = req.body.id;
    const cVal = req.body.val;
    let cRoom = await Room.where({id: roomID}).findOne();
    if (cRoom && cRoom.hostId == playerID && cRoom.data.startedStatus == 0) {
        let val = parseInt(cVal); if (isNaN(val)) {val = 0;}
        if (val > 0) {
            try {
                cRoom.data[cId] = val;
                await Room.updateOne({id: roomID}, {$set: {data: cRoom.data}});
            } catch (e) {console.log(e)}
        }
    }

    res.send('ok');
});

router.post('/delete_room', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    let cRoom = await Room.where({id: roomID}).findOne();
    if (cRoom && cRoom.hostId == playerID) {
        try {
            await Player.deleteMany({roomId: roomID});
            await Room.deleteOne({id: roomID});
        } catch (e) {console.log(e)}
    }
    res.send('ok');
});

router.post('/start_game', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    let status = "";
    let cRoom = await Room.where({id: roomID}).findOne();
    if (cRoom && cRoom.hostId == playerID) {
        try {
            const players = await Player.find({roomId: roomID}).lean();
            cRoom.data.startedStatus = 1;
            cRoom.data.fields = utils.createMineFields(cRoom.data, players);
            await Room.updateOne({id: roomID}, {$set: {data: cRoom.data}});
            status = "ok";
        } catch (e) {console.log(e)}
    }
    res.send(status);
});

router.post('/change_cell', async (req, res) => {
    const playerID = req.cookies.playerID;
    const roomID = req.cookies.roomID;
    const cell = req.body.id;
    const mode = req.body.mode;

    let status = "";
    let cRoom = await Room.where({id: roomID}).findOne();
    if (cRoom) {
        cRoom.data = utils.changeCellInField(cRoom.data, playerID, cell, mode);
        await Room.updateOne({id: roomID}, {$set: {data: cRoom.data}});
        status = "ok";
    }

    res.send({status});
});


module.exports = router
