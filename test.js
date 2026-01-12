//include the Slippi library
const { SlippiGame, stages, characters } = require("@slippi/slippi-js");
const fs = require('fs');
const path = require('path');

let files = [];
directory = "/home/eric/Slippi/2025";

const getFilesRecursively = (directory) => {
    console.log(`Reading directory: ${directory}`);
  const filesInDirectory = fs.readdirSync(directory);
  for (const file of filesInDirectory) {
    const absolute = path.join(directory, file);
    if (fs.statSync(absolute).isDirectory()) {
        getFilesRecursively(absolute);
    } else {
        files.push(absolute);
    }
  }
};
getFilesRecursively(directory);


userToLookFor = "FantasticDeli";
myCharacter = "Fox"; // Character you're playing as, or leave empty for all characters ("")
// testCharacterArray = ["Sheik", "Fox", "Falco", "Marth", "Captain Falcon", "Jigglypuff", "Peach", "Yoshi", "Ice Climbers", "Samus", "Donkey Kong", "Luigi", "Pikachu", "Ness", "Kirby", "Mr. Game & Watch", "Young Link", "Link", "Zelda", "Bowser", "Ganondorf", "Mewtwo", "Roy", "Pichu", "Dr. Mario", "Mario"]; 
testCharacterArray = ["Ganondorf"];
testStageArray = ["Battlefield", "Pokémon Stadium", "Final Destination", "Yoshi's Story", "Dream Land N64", "Fountain of Dreams"];
resultArray = [];

testCharacterArray.forEach(testCharacter => {
    totalWins = 0;
    totalLosses = 0;
    testStageArray.forEach(testStage => {
        wins = 0;
        losses = 0;
        files.forEach(slpFile => {
            [userCharacter, opponentCharacter, stage, opponentName, winState] = processOneGame(slpFile);
            if ((userCharacter == myCharacter) || (myCharacter == "")) {
                if ((opponentCharacter == testCharacter) && (stage == testStage)) {
                    if (winState) {
                        wins++; totalWins++;
                    } else {
                        losses++; totalLosses++;
                    }
                }
            }
        });
        resultArray.push({ character: testCharacter, stage: testStage, winRate: (wins / (wins + losses) * 100).toFixed(2), totalGames: wins + losses });
        console.log(`Win Rate: ${(wins / (wins + losses) * 100).toFixed(2)}% on ${testStage} vs ${testCharacter}    (${wins+losses} games) `);
    });
    resultArray.push({ character: testCharacter + " Totals", stage: "", winRate: (totalWins / (totalWins + totalLosses) * 100).toFixed(2), totalGames: totalWins + totalLosses });

});

resultArray.sort(compareGameResults);
resultArray.forEach(result => {
    console.log(`
        Vs: ${result.character} ${(result.stage == "") ? "" : `on  Stage: ${result.stage}`}
        Win Rate: ${result.winRate}%, Total Games: ${result.totalGames}`);
});


function compareGameResults( a, b ) {
    if (a.character.includes("Totals") && b.character.includes("Totals")) {
        //sort by win rate only for totals
        if ( Number(a.winRate) < Number(b.winRate) ){
            return -1;
        }
        if ( Number(a.winRate) > Number(b.winRate) ){
            return 1;
        }
        return 0;
    }


    //for stage-by-stage breakdown, sort by character, then by win rate
    if ( a.character < b.character ){
        return -1;
    }
    if ( a.character > b.character ){
        return 1;
    }
    if ( Number(a.winRate) < Number(b.winRate) ){
        return -1;
    }
    if ( Number(a.winRate) > Number(b.winRate) ){
        return 1;  
    }
    return 0;
}

//read the SLP file
function processOneGame(gameFileLocation) {


    game = new SlippiGame(gameFileLocation); 

    settings = game.getSettings();
    if (settings == null) {
        console.log(`Game settings not found for ${gameFileLocation}`);
        return "null";
    }

    if (settings.isTeams) {
        // console.log("This is a teams game, not singles. Doubles not currently supported.");
        return "teams";
    }



    //get player indexes and characters
    let userIndex = -1;
    for (let i = 0; i < settings.players.length; i++) {
        if (settings.players[i].displayName == userToLookFor) {
            userIndex = i;
            userCharacter = characters.getCharacterName(settings.players[i].characterId);
        }
        else {
            opponentCharacter = characters.getCharacterName(settings.players[i].characterId);
            opponentIndex = i;
        }
    }
    // if (userIndex === -1) {
        // console.log(`User ${userToLookFor} not found in game settings.`);
    // }



    winState = checkWinOrLoss(game, userToLookFor);
    return [userCharacter, opponentCharacter, stages.getStageName(settings.stageId), settings.players[opponentIndex].displayName, winState];

}


function checkWinOrLoss(game, userToLookFor) {
    //check if the user won or lost - singles only
    returnValue = false;
    game.getWinners().forEach((winner) => {
        if (settings.players[winner.playerIndex].displayName === userToLookFor) {
            // a win
            // console.log(`Player ${userToLookFor} won on stage ${stages.getStageName(settings.stageId)}!`);
            returnValue = true;
        } 
    })
    return returnValue;
}
