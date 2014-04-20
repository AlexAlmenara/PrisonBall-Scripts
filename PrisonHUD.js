#pragma strict
// GameHUD: Platformer Tutorial Master GUI script.

// This script handles the in-game HUD, showing the lives, number of fuel cells remaining, etc.

var guiSkin: GUISkin;
var gameMessageTime = 3;
var nativeVerticalResolution = 1200.0;

var scoreBoardImage: Texture2D;
var remainPlayers1Style: GUIStyle;
var remainPlayers2Style: GUIStyle;
var gameMessageStyle: GUIStyle;

var scoreBoardOffset = Vector2(0, 0);
var remainPlayers1Offset = Vector2(350, 1150);
var remainPlayers2Offset = Vector2(370, 1150);
var burnMessageOffset = Vector2(200, 1050);
var endMessageOffset = Vector2(200, 1000);
var outMessageOffset = Vector2(200, 950);
var turnMessageOffset = Vector2(200, 900);
//XXX: var otherMessageOffset = Vector2(200, 900);

//this variables indicates that a specific message is displaying
private var burning = false;
private var ending = false;
private var goingOut = false;
private var turning = false; //change turn of team
//XXX: private var bonus = false;
//private var lastChance = false;


//diffentent messages to display
private var remainPlayers1 : String;
private var remainPlayers2 : String;
private var messageBurn : String;
private var messageEnd : String;
private var messageOut : String;
private var messageTurn : String;
//private var messageBonus : String;
//private var messageLastChance : String;


private var s_PrisonRules : PrisonRules;

// Cache link to player's state management script for later use.
function Awake() {

	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules); //function FindObjectOfType very slow

	if (!s_PrisonRules)
		Debug.Log("No could find PrisonRules script");
		
	remainPlayers1 = s_PrisonRules.GetRemainPlayers1().ToString();
 	remainPlayers2 = s_PrisonRules.GetRemainPlayers2().ToString();
}

function OnGUI () {

	GUI.skin = guiSkin; // Set up gui skin

	// Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
	GUI.matrix = Matrix4x4.TRS (Vector3(0, 0, 0), Quaternion.identity, Vector3 (Screen.height / nativeVerticalResolution, Screen.height / nativeVerticalResolution, 1)); 

	if (scoreBoardImage) //XXX: for efficiency quit this if
		DrawImageBottomAligned(scoreBoardOffset, scoreBoardImage);

	DrawLabelBottomAligned(remainPlayers1Offset, remainPlayers1, remainPlayers1Style); // Displays number of burned players of team 1
	
	// Now it's the fuel cans' turn. We want this aligned to the lower-right corner of the screen:
	DrawLabelBottomRightAligned(remainPlayers2Offset, remainPlayers2, remainPlayers2Style);
	
	if (burning)
		DrawLabelBottomAligned(burnMessageOffset, messageBurn, gameMessageStyle);

	if (ending)
		DrawLabelBottomAligned(endMessageOffset, messageEnd, gameMessageStyle);
		
	if (goingOut)
		DrawLabelBottomAligned(outMessageOffset, messageOut, gameMessageStyle);
		
	if (turning)
		DrawLabelBottomAligned(turnMessageOffset, messageTurn, gameMessageStyle);
		
}


function OnBurned(namePlayer: String, team : int) { //PrisonRules.js send this message for print the event of a person burned
 	burning = true;
 	remainPlayers1 = s_PrisonRules.GetRemainPlayers1().ToString();
 	remainPlayers2 = s_PrisonRules.GetRemainPlayers2().ToString();
	messageBurn = "Burned " + namePlayer + " of team " + team;
 	yield WaitForSeconds(gameMessageTime);
 	burning = false;
} 

//XXX: function OnRevive(namePlayer: String, team : int)

function OnEnd(teamWinner: int) { //PrisonRules.js send this message for print the event of end of the game, and load the Scene GameOver
	ending = true;
	messageEnd = "Game Over: Team " + teamWinner + " wins!";
	yield WaitForSeconds(gameMessageTime);
	ending = false;
	Application.LoadLevel("GameOver");
}


function OnBallOut(area: int, namePlayer: int) { //PrisonRules.js send this message for print the event of the ball is out
	if (!ending) {
		goingOut = true;
		messageOut = "Ball out of area " + area + ", so return to " + namePlayer;
		yield WaitForSeconds(gameMessageTime);
		goingOut = false;
	}

}

function OnTurnChanged(turn : int) {
	turning = true;
	messageTurn = "Team " + turn + " attack turn!";
	yield WaitForSeconds(gameMessageTime);
	turning = false;
}

function OnKinectUserLost(user: int) {
//TODO
}

function DrawImageBottomAligned (pos : Vector2, image : Texture2D) {
	GUI.Label(Rect (pos.x, nativeVerticalResolution - image.height - pos.y, image.width, image.height), image);
}

function DrawLabelBottomAligned (pos : Vector2, text : String, style: GUIStyle) { //antes: 100, 100
	GUI.Label(Rect (pos.x, nativeVerticalResolution - pos.y, 800, 100), text, style); //Label() could be called without style
}

function DrawImageBottomRightAligned (pos : Vector2, image : Texture2D) {
	var scaledResolutionWidth = nativeVerticalResolution / Screen.height * Screen.width;
	GUI.Label(Rect (scaledResolutionWidth - pos.x - image.width, nativeVerticalResolution - image.height - pos.y, image.width, image.height), image);
}

function DrawLabelBottomRightAligned (pos : Vector2, text : String, style : GUIStyle) {
	var scaledResolutionWidth = nativeVerticalResolution / Screen.height * Screen.width;
	GUI.Label(Rect (scaledResolutionWidth - pos.x, nativeVerticalResolution - pos.y, 800, 100), text, style);
}

//XXX: dibujar respecto del centro de la pantalla