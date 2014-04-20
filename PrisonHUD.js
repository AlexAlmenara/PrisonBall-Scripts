#pragma strict
// GameHUD: Platformer Tutorial Master GUI script.

// This script handles the in-game HUD, showing the lives, number of fuel cells remaining, etc.

var guiSkin: GUISkin;
var gameMessageTime = 0.2; //3.0;
var nativeHeightResolution = 1200.0;
private var scaledWidthResolution : float = nativeHeightResolution / Screen.height * Screen.width;

var kinect = false;
var screenSplitted = false;

var scoreBoardImage: Texture2D;
var remain1Style: GUIStyle;
var remain2Style: GUIStyle;
var player1Style: GUIStyle;
var player2Style: GUIStyle;
var gameMessageStyle: GUIStyle;
var endMessageStyle: GUIStyle;

var scoreBoardOffset = Vector2(130, 17);
var remainPlayers1Offset = Vector2(-70, 50);
var remainPlayers2Offset = Vector2(45, 50);

var burnMessageOffset = Vector2(-550, -450);
var endMessageOffset = Vector2(-550, -100);
var outMessageOffset = Vector2(-410, -470);
var turnMessageOffset = Vector2(-550, -350);

var fullUser1MessageOffset = Vector2(-400, 0);

private var splitUser1MessageOffset : Vector2; //these offsets depends of fullUser1MessageOffset
private var user1MessageOffset : Vector2;
private var user2MessageOffset: Vector2;

//XXX: var otherMessageOffset = Vector2(200, 900);

//this variables indicates that a specific message is displaying
private var burning = false;
private var ending = false;
private var goingOut = false;
private var turning = false; //change turn of team
private var userLost1 = true; //kinect users are lost or not
private var userLost2 = true;
//XXX: private var bonus = false;
//private var lastChance = false;


//diffentent messages to display
private var remainPlayers1 : String;
private var remainPlayers2 : String;
private var burnMessage : String;
private var endMessage : String;
private var outMessage : String;
private var turnMessage : String;
private var user1Message = "User 1 Lost";
private var user2Message = "User 2 Lost";
//private var messageBonus : String;
//private var messageLastChance : String;


private var s_PrisonRules : PrisonRules;

// Cache link to player's state management script for later use.
function Awake() {

	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules); //function FindObjectOfType very slow

	if (!s_PrisonRules)
		Debug.LogWarning("No could find PrisonRules script");
		
	remainPlayers1 = s_PrisonRules.GetRemainPlayers1().ToString();
 	remainPlayers2 = s_PrisonRules.GetRemainPlayers2().ToString();
 	
 	splitUser1MessageOffset = Vector2( 
		- ( ((Mathf.Abs(fullUser1MessageOffset.x) * (scaledWidthResolution / 2)) / scaledWidthResolution) + scaledWidthResolution / 4),
		fullUser1MessageOffset.y);
	

	user2MessageOffset = Vector2( 
		scaledWidthResolution / 2 - Mathf.Abs(splitUser1MessageOffset.x),
		fullUser1MessageOffset.y);
		
	//test (for this, comment the 'if' lines in OnGui()
	/*burnMessage = "Burned pepito of team 69";
	endMessage = "Game Over: Team 6 wins!";
	outMessage = "Ball out of area 69. \n Return to pepitoooo";
	turnMessage = "Team 6 attack turn!";*/
	
}


function SplitScreen(state: boolean) { //if true (two users) some messages will be shown as a splitted screen. if false (only one user) as a full screen
	//if (screenSpliteed == state) return; //there was the same state, nothing to do
	screenSplitted = state;
	if (state)
		user1MessageOffset = splitUser1MessageOffset; 
	else
		user1MessageOffset = fullUser1MessageOffset;
}

function SetKinectMessages(state: boolean) {
	kinect = state;
}


function OnGUI() {

	GUI.skin = guiSkin; // Set up gui skin for set the default configuration of messages

	// Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
	GUI.matrix = Matrix4x4.TRS (Vector3(0, 0, 0), Quaternion.identity, Vector3 (Screen.height / nativeHeightResolution, Screen.height / nativeHeightResolution, 1)); 

	if (scoreBoardImage) //XXX: for efficiency quit this if
		CenterDrawImageUpCenter(scoreBoardOffset, scoreBoardImage);

	DrawLabelUpCenter(remainPlayers1Offset, remainPlayers1, remain1Style); // Displays number of burned players of team 1
	
	// Now it's the fuel cans' turn. We want this aligned to the lower-right corner of the screen:
	DrawLabelUpCenter(remainPlayers2Offset, remainPlayers2, remain2Style);
	
	if (burning)
		DrawLabelCenter(burnMessageOffset, burnMessage, gameMessageStyle);

	if (ending)
		DrawLabelCenter(endMessageOffset, endMessage, endMessageStyle);
		
	if (goingOut)
		DrawLabelCenter(outMessageOffset, outMessage, gameMessageStyle);
		
	if (turning)
		DrawLabelCenter(turnMessageOffset, turnMessage, gameMessageStyle);
		
	if (kinect) {
		if (userLost1)
			DrawLabelCenter(user1MessageOffset, user1Message, player1Style);
				
		if (screenSplitted && userLost2)
			DrawLabelCenter(user2MessageOffset, user2Message, player2Style);
	} //kinect	
}


//************* Messages received from PrisonRules.js *****************************************

function OnBurned(namePlayer: String, team : int) { //PrisonRules.js send this message for print the event of a person burned
 	burning = true;
 	remainPlayers1 = s_PrisonRules.GetRemainPlayers1().ToString();
 	remainPlayers2 = s_PrisonRules.GetRemainPlayers2().ToString();
	burnMessage = "Burned " + namePlayer + " of team " + team;
 	yield WaitForSeconds(gameMessageTime);
 	burning = false;
} 

//TODO: function OnRevive(namePlayer: String, team : int)

function OnEnd(teamWinner: int) { //PrisonRules.js send this message for print the event of end of the game, and load the Scene GameOver
	ending = true;
	endMessage = "Game Over: Team " + teamWinner + " wins!";
	yield WaitForSeconds(gameMessageTime);
	ending = false;
	Application.LoadLevel("GameOver");
}


function OnBallOut(area: int, namePlayer: String) { //PrisonRules.js send this message for print the event of the ball is out
	if (!ending) {
		goingOut = true;
		outMessage = "Ball out of area " + area + "\nReturn to " + namePlayer;
		yield WaitForSeconds(gameMessageTime);
		goingOut = false;
	}

}

function OnTurnChanged(turn : int) {
	turning = true;
	turnMessage = "Team " + turn + " attack turn!";
	yield WaitForSeconds(gameMessageTime);
	turning = false;
}

function OnKinectUserLost(user: int) { //when a Kinect user is lost, set a continuous message. user = {1, 2}
	if (user == 1)
		userLost1 = true;
	else
		userLost2 = true;
}

function OnKinectUserFound(user: int) {
	if (user == 1)
		userLost1 = false;
	else
		userLost2 = false;
}



//************* functions from draw the messages and the ScoreBoard image **********************************

/*function DrawLabelUpLeft(pos : Vector2, text : String, style : GUIStyle) { //draw a text label from the up-left corner of screen + position, with style
	GUI.Label(Rect (pos.x, pos.y, 800, 100), text, style);
}


function DrawLabelBottomLeft(pos : Vector2, text : String, style: GUIStyle) { //antes: 100, 100
	GUI.Label(Rect (pos.x, nativeHeightResolution - pos.y, 800, 100), text, style); //Label() could be called without style
}

function DrawImageBottomLeft(pos : Vector2, image : Texture2D) { //draw image from the bottom-left corner + position
	GUI.Label(Rect (pos.x, nativeHeightResolution - image.height - pos.y, image.width, image.height), image);
}


function DrawLabelBottomRight(pos : Vector2, text : String, style : GUIStyle) {
	GUI.Label(Rect (scaledWidthResolution - pos.x, nativeHeightResolution - pos.y, 800, 100), text, style);
}

function DrawImageBottomRight(pos : Vector2, image : Texture2D) { //draw image from the bottom-right corner + position
	GUI.Label(Rect (scaledWidthResolution - pos.x - image.width, nativeHeightResolution - image.height - pos.y, image.width, image.height), image);
}*/


function DrawLabelUpCenter(pos : Vector2, text : String, style : GUIStyle) { //draw a text label from the up-center of screen + position, with style
	GUI.Label(Rect (pos.x + scaledWidthResolution / 2, pos.y, 100, 100), text, style);
}

 //draw a image from the up-center of screen + position, with style. the pos is the centre of the image by x
function CenterDrawImageUpCenter(pos : Vector2, image : Texture2D) {
	GUI.Label(Rect (pos.x + scaledWidthResolution / 2 - image.width / 2, pos.y, image.height, image.width), image);
}


function DrawLabelCenter(pos : Vector2, text : String, style : GUIStyle) {  //draw a text label from the center of screen + position, with style
	GUI.Label(Rect (pos.x + scaledWidthResolution / 2, pos.y + nativeHeightResolution / 2, 100, 100), text, style);
}