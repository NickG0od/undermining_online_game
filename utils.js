const fs = require('fs')
const JSONStream = require('JSONStream')


class Utils {
    constructor() {}

    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    makeCode(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(this.getRandomInt(charactersLength));
        }
        return result;
    }

    createMineFields(roomData = null, players = null) {
        function ShuffleArr(array, $this) {
            let currentIndex = array.length,  randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor($this.getRandomInt(currentIndex));
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        }
        function CreateWatchField(size) {
            let field = new Array(size);
            for (let i = 0; i < field.length; i++) {field[i] = new Array(size);}
            for (let i = 0; i < field.length; i++) {
                for (let j = 0; j < field[i].length; j++) {
                    field[i][j] = 0;
                }
            }
            return field;
        }
        function CreateMinesField(size, bombs, $this) {
            let seq = new Array(size*size).fill(0);
            let bombsSet = 0;
            for (let i = 0; i < seq.length; i++) {
                seq[i] = 1;
                bombsSet ++;
                if (bombsSet >= bombs) {break;}
            }
            seq = ShuffleArr(seq, $this);
            let field = new Array(size);
            for (let i = 0; i < field.length; i++) {field[i] = new Array(size);}
            for (let i = 0; i < field.length; i++) {
                for (let j = 0; j < field[i].length; j++) {
                    field[i][j] = seq[i*size+j];
                }
            }
            return field;
        }
        if (!roomData || !players) {return null;}
        let fields = [];
        let randPlayerInd = this.getRandomInt(players.length);
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            let watchField = CreateWatchField(roomData.fieldSize);
            let minesField = CreateMinesField(roomData.fieldSize, roomData.bombsCount, this);
            let isMove = i == randPlayerInd ? 1 : 0;
            fields.push({playerId: player.id, usedFlags: 0, explodedBombs: 0, watchField, minesField, move: isMove});
        }
        return fields;
    }

    changeCellInField(data, playerId, cell, mode) {
        function CompareIfExists(field, x, y, val) {
            let size = field.length;
            if (x >= 0 && x < size && y >= 0 && y < size) {
                return field[x][y] == val;
            }
            return false;
        }
        function ChangeIfExists(field, mines, x, y, val) {
            let size = field.length;
            if (x >= 0 && x < size && y >= 0 && y < size) {
                if (field[x][y] == 0 && mines[x][y] == 0) {field[x][y] = val;}
            }
        }
        function OpenCell(watchField, minesField, x, y, clicked = false) {
            let size = watchField.length;
            if (!(x >= 0 && x < size && y >= 0 && y < size)) {return false;}
            if (watchField[x][y] != 0) {return false;}
            let bombsAround = 0;
            let explodedBomb = false;
            if (clicked && minesField[x][y] == 1) {
                watchField[x][y] = -2;
                ChangeIfExists(watchField, minesField, x-1, y, -2);
                ChangeIfExists(watchField, minesField, x+1, y, -2);
                ChangeIfExists(watchField, minesField, x, y-1, -2);
                ChangeIfExists(watchField, minesField, x-1, y-1, -2);
                ChangeIfExists(watchField, minesField, x+1, y-1, -2);
                ChangeIfExists(watchField, minesField, x, y+1, -2);
                ChangeIfExists(watchField, minesField, x-1, y+1, -2);
                ChangeIfExists(watchField, minesField, x+1, y+1, -2);
                explodedBomb = true;
            } else {
                if (CompareIfExists(minesField, x-1, y, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x+1, y, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x, y-1, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x-1, y-1, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x+1, y-1, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x, y+1, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x-1, y+1, 1)) {bombsAround ++};
                if (CompareIfExists(minesField, x+1, y+1, 1)) {bombsAround ++};

                if (bombsAround == 0) {
                    watchField[x][y] = -3;
                    OpenCell(watchField, minesField, x-1, y);
                    OpenCell(watchField, minesField, x+1, y);
                    OpenCell(watchField, minesField, x, y-1);
                    OpenCell(watchField, minesField, x-1, y-1);
                    OpenCell(watchField, minesField, x+1, y-1);
                    OpenCell(watchField, minesField, x, y+1);
                    OpenCell(watchField, minesField, x-1, y+1);
                    OpenCell(watchField, minesField, x+1, y+1);
                } else {
                    watchField[x][y] = bombsAround;
                }
            }
            return explodedBomb;
        }

        let cellX = 0, cellY = 0;
        try {
            let parsed = cell.split('_');
            cellX = parseInt(parsed[0]);
            cellY = parseInt(parsed[1]);
            if (isNaN(cellX) || isNaN(cellY)) {return data;}
        } catch(e) {return data;}
        let canEdit = false; let tmpIndex = -1; let isChangeTurn = false;
        for (let i = 0; i < data.fields.length; i++) {
            if (data.fields[i].playerId == playerId) {
                canEdit = data.fields[i].move == 1;
                tmpIndex = i;
                break;
            }
        }
        if (!canEdit) {return data;}
        for (let i = 0; i < data.fields.length; i++) {
            let watchField = data.fields[i].watchField;
            let minesField = data.fields[i].minesField;
            if (data.fields[i].playerId == playerId) {
                if (mode == 1) { // set flag
                    if (watchField[cellX][cellY] == 0 && data.fields[i].usedFlags < data.flags) {
                        watchField[cellX][cellY] = -1;
                        data.fields[i].usedFlags ++;
                    }
                }
            }
            if (mode == 0) { // open cell
                if (watchField[cellX][cellY] == 0) {
                    let explodedBomb = OpenCell(watchField, minesField, cellX, cellY, true);
                    if (explodedBomb) {
                        data.fields[i].explodedBombs ++;
                        if (data.fields[i].explodedBombs >= data.winGoal) {
                            data.lose = data.fields[i].playerId;
                        }
                    }
                    isChangeTurn = true;
                }
            }
        }
        if (isChangeTurn) {
            data.fields[tmpIndex].move = 0; tmpIndex ++;
            if (tmpIndex >= data.fields.length) {tmpIndex = 0;}
            data.fields[tmpIndex].move = 1;
        }
        return data;
    }

}

const utils = new Utils()
module.exports = utils
