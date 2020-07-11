import os
import json


pathIn = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'input.txt')
pathOut = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dataCodeRegs.json')
data = {"data": []}

with open(pathIn, 'r', encoding='utf8') as f:
    for line in f:
        splitted = line.split(' \t')
        try:
            if splitted[0] and splitted[1]:
                region = ""
                for i in range(len(splitted)):
                    if i != 0:
                        region += splitted[i].replace('\t', '').replace('\n', '')
                temp = {
                    "title": region,
                    "iso3166": splitted[0].replace('\t', '').replace('\n', ''),
                }
                data["data"].append(temp)
        except:
            pass

with open(pathOut, 'w', encoding='utf8') as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
  
