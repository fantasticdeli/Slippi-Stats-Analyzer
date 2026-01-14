//include the Slippi library
const { SlippiGame, stages, characters } = require("@slippi/slippi-js");
const fs = require('fs');
const path = require('path');

let files = [], resultArray = [];


// ##################################################################################
// ###  If you downloaded this file, read this!
// ###  Edit the below variable assignments - comments indicating what to change
// ##################################################################################

// Top-level folder for your Slippi files. Any sub-folders will be included.
// This should be the full path, starting with C:\Users\ on Windows, or /home/username/... on Linux/Mac.
// This MUST use forward slashes (/) even on Windows systems.
slpFileDirectory = "/home/eric/Slippi/2025"; 

// Your username, in the Slippi files. Change at least one value to your own. The other can be blank.
// Blank values should look like this:
//      userToLookFor = {"displayName": "", "connectCode": ""};
userToLookFor = {"displayName": "FantasticDeli", "connectCode": "DELI#945"};

// Character you're playing as, or leave empty for all characters ("")
myCharacter = "Fox"; 

// Opponent characters to include. Choose as many as you want - behavior is the same, just slower for more characters.
// For all characters, uncomment the line below and comment out the next line. 
// testCharacterArray = ["Sheik", "Fox", "Falco", "Marth", "Captain Falcon", "Jigglypuff", "Peach", "Yoshi", "Ice Climbers", "Samus", "Donkey Kong", "Luigi", "Pikachu", "Ness", "Kirby", "Mr. Game & Watch", "Young Link", "Link", "Zelda", "Bowser", "Ganondorf", "Mewtwo", "Roy", "Pichu", "Dr. Mario", "Mario"]; 
testCharacterArray = ["Ganondorf"];

// Stages to include. For all stages, leave unchanged.
testStageArray = ["Battlefield", "Pokémon Stadium", "Final Destination", "Yoshi's Story", "Dream Land N64", "Fountain of Dreams"];


// ##################################################################################
// ###  End of user-editable section
// ##################################################################################



//function to build the 'files' array with all SLP files in the directory and subdirectories
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
getFilesRecursively(slpFileDirectory);


//foreach loop, processing one character at a time
testCharacterArray.forEach(testCharacter => {
    totalWins = 0;
    totalLosses = 0;
    //nested foreach loop, processing one stage at a time for that character.
    testStageArray.forEach(testStage => {
        wins = 0;
        losses = 0;
        //read through all of the files, incrementing wins/losses if they match the character/stage being tested.
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
        //after processing all files, calculate and store the win rate for that character/stage combination
        resultArray.push({ character: testCharacter, stage: testStage, winRate: (wins / (wins + losses) * 100).toFixed(2), totalGames: wins + losses });
        //redundant code? can likely be removed.
        // console.log(`Win Rate: ${(wins / (wins + losses) * 100).toFixed(2)}% on ${testStage} vs ${testCharacter}    (${wins+losses} games) `);
    });
    //after processing all stages for that character, calculate and store the overall win rate for that character
    resultArray.push({ character: testCharacter + " Totals", stage: "", winRate: (totalWins / (totalWins + totalLosses) * 100).toFixed(2), totalGames: totalWins + totalLosses });

});

//sort the results array and print it out. compareGameResults function defined below.
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

//Process one game file, returning relevant data.
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
        //Match on either display name or connect code, if they're set.
        if (((userToLookFor.displayName != "") && (settings.players[i].displayName == userToLookFor.displayName))
        || ((userToLookFor.connectCode != "") && (settings.players[i].connectCode == userToLookFor.connectCode))) {
            
            userIndex = i;
            userCharacter = characters.getCharacterName(settings.players[i].characterId);
        }
        else { 
            opponentCharacter = characters.getCharacterName(settings.players[i].characterId);
            opponentIndex = i;
        }
    }
    if (userIndex === -1) {
        console.log(`User ${userToLookFor.displayName} - ${userToLookFor.connectCode} not found in game ${gameFileLocation}. This may be okay. Skipping this game.`);
        return "notFound"
    }



    winState = checkWinOrLoss(game, userToLookFor);
    return [userCharacter, opponentCharacter, stages.getStageName(settings.stageId), settings.players[opponentIndex].displayName, winState];

}

//check if 'userToLookFor' won the game. Return true for win, false for loss.
function checkWinOrLoss(game, userToLookFor) {
    //check if the user won or lost - singles only
    returnValue = false;
    game.getWinners().forEach((winner) => {
        if ((settings.players[winner.playerIndex].displayName === userToLookFor.displayName) 
        || (settings.players[winner.playerIndex].connectCode === userToLookFor.connectCode)) {
            // a win
            // console.log(`Player ${userToLookFor} won on stage ${stages.getStageName(settings.stageId)}!`);
            returnValue = true;
        } 
    })
    return returnValue;
}
