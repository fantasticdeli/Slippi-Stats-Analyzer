const { SlippiGame } = require("@slippi/slippi-js");

function getSinglesWinStatus(game, userToLookFor) {

    // Get game settings – stage, characters, etc
    const settings = game.getSettings();
    console.log(settings);
    if (settings.isTeams) {
        console.log("This is a teams game, not singles. Dev note: use getDoublesWinStatus instead [TODO].");
        return "teams";
    }

    for (let i = 0; i < settings.players.length; i++) {
        // console.log(`Found ${settings.players[i].displayName} at index ${i}`);
        if (settings.players[i].displayName == userToLookFor) {
            console.log(`Found ${userToLookFor} at index ${i}`);
            userIndex = i;
            break;
        }
    }


    // Get game end state – winner, final stocks, etc
    const end = game.getGameEnd();
    console.log(end);

    // Who won?
    end.placements.forEach((placement) => {
        if (placement.playerIndex === userIndex) {
            if (placement.position == 0) {
                console.log(`Player ${userToLookFor} won on stage ${settings.stageId}.`);
                return "win";
            }
            else {
                console.log(`Player ${userToLookFor} lost on stage ${settings.stageId}.`);
                return "loss";
            }}
    });

}








module.exports = {
    getSinglesWinStatus
};