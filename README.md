# blue-mail-tic-tac-toe

Welcome to my tic tac toe game, the game is played using socket.io requests, with eventNames according to the operations you want to do, and add the arguments at the order presented:

joinGame - use this event to join a game with a first argument - a room id, it will create this room if it does not exist and start a game if a player already created it. you will recieve your symbol for the game.

makeMove - send this event to play your turn. you'll need to send the roomId of the game, a valid row index between 0 and the game row size (you can view it in the game board matrix size).
and a valid column index with the same conditions.

you will also need to listen to the following events for game updates:
joined,
update,
gameOver,
playerLeft,
startGame.

enjoy!
