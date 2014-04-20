#pragma strict
/*  Show the HUD of the game PrisonRules. Also can show the pause menu.
    Inspirate in GameHUD.js of 3DPlatform.
*/

var guiSkin: GUISkin;
var gameMessageTime = 0.2; //3.0;
var drawer : GUIDrawer = new GUIDrawer();

private var kinect = false;
private var screenSplitted = false;
private var paused = false; //game paused

var scoreBoardImage: Texture2D;
var remain1Style: GUIStyle;
var remain2Style: GUIStyle;
var player1Style: GUIStyle;
var player2Style: GUIStyle;
var gameMessageStyle: GUIStyle; //default style of messages
var burnMessageStyle: GUIStyle; //particular styles
var reviveMessageStyle: GUIStyle;
var endMessageStyle: GUIStyle;

var scoreBoardOffset = Vector2(130, 17);
var remainPlayers1Offset = Vector2(-70, 50);
var remainPlayers2Offset = Vector2(45, 50);

var burnMessageOffset = Vector2(-550, -470);
var reviveMessageOffset = Vector2(-550, -400);
var endMessageOffset = Vector2(-550, -100);
var outMessageOffset = Vector2(-410, -470);
var turnMessageOffset = Vector2(-460, -410);

var fullUser1MessageOffset = Vector2(-400, 0);

private var splitUser1MessageOffset : Vector2; //these offsets depends of fullUser1MessageOffset
private var user1MessageOffset : Vector2;
private var user2MessageOffset: Vector2;

//XXX: var otherMessageOffset = Vector2(200, 900);

//this variables indicates that a specific message is displaying
private var burning = false;
private var reviving = false;
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
private var reviveMessage : String;
private var endMessage : String;
private var outMessage : String;
private var turnMessage : String;
private var user1Message = "User 1 Lost";
private var user2Message = "User 2 Lost";
//private var messageBonus : String; //TODO
//private var messageLastChance : String;


private var s_PrisonRules : PrisonRules;


function PassiveStart() {
	Time.timeScale = 1; //by security: for example, if we reload the level from PauseMenu we need to set the velocity of time as normal again
	s_PrisonRules = GameObject.FindGameObjectWithTag("PrisonRules").GetComponent(PrisonRules); //function FindObjectOfType very slow

	if (!s_PrisonRules)
		Debug.LogWarning("No could find PrisonRules script");
		
	remainPlayers1 = s_PrisonRules.nRemain1.ToString();
 	remainPlayers2 = s_PrisonRules.nRemain2.ToString();
 	
 	splitUser1MessageOffset = Vector2( 
		- ( ((Mathf.Abs(fullUser1MessageOffset.x) * (drawer.GetResolutionWidth() / 2)) / drawer.GetResolutionWidth()) + drawer.GetResolutionWidth() / 4),
		fullUser1MessageOffset.y);
	

	user2MessageOffset = Vector2( 
		drawer.GetResolutionWidth() / 2 - Mathf.Abs(splitUser1MessageOffset.x),
		fullUser1MessageOffset.y);
		
	//test the position of all messages (for this, comment the 'if' lines in OnGui()
	/*burnMessage = "Burned pepito of team 69";
	reviveMessage = "Revived tronco of team 50";
	endMessage = "Game Over: Team 6 wins!";
	outMessage = "Ball out of area 69. \n Return to pepitoooo";
	turnMessage = "Team 6 attack turn!"; // */
	
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
	if (paused)
		return;
		
	GUI.skin = guiSkin; // Set up gui skin for set the default configuration of messages
	drawer.IndependentResolution();
	
	drawer.CenterImage_UpCenter(scoreBoardOffset, scoreBoardImage); //if (scoreBoardImage) // for efficiency quit this if

	drawer.Label_UpCenter(remainPlayers1Offset, remainPlayers1, remain1Style); // Displays number of burned players of team 1
	
	drawer.Label_UpCenter(remainPlayers2Offset, remainPlayers2, remain2Style);
	
	if (burning)
		drawer.Label_Center(burnMessageOffset, burnMessage, burnMessageStyle);

	if (reviving)
		drawer.Label_Center(reviveMessageOffset, reviveMessage, reviveMessageStyle);
		
	if (ending)
		drawer.Label_Center(endMessageOffset, endMessage, endMessageStyle);
		
	if (goingOut)
		drawer.Label_Center(outMessageOffset, outMessage, gameMessageStyle);
		
	if (turning)
		drawer.Label_Center(turnMessageOffset, turnMessage, gameMessageStyle);
		
	if (kinect) {
		if (userLost1)
			drawer.Label_Center(user1MessageOffset, user1Message, player1Style);
				
		if (screenSplitted && userLost2)
			drawer.Label_Center(user2MessageOffset, user2Message, player2Style);
	} //kinect
}


function Update() { //TODO: make manu of pause
	if (Input.GetButtonUp("Pause")) //Pause defined in InputManager	
		SendMessage("OnPaused", !paused); //send to this script and PauseMenuGUI.js
}

//************* Messages received from PrisonRules.js *****************************************

function OnBurned(namePlayer: String, team : int) { //PrisonRules.js send this message for print the event of a person burned
 	burning = true;
 	remainPlayers1 = s_PrisonRules.nRemain1.ToString();
 	remainPlayers2 = s_PrisonRules.nRemain2.ToString();
	burnMessage = "Burned " + namePlayer + " of team " + team; //TODO: + "\n Revived player xxx"; add param revivedPlayer, by default -1
 	yield WaitForSeconds(gameMessageTime);
 	burning = false;
} 

function OnRevived(namePlayer: String, team : int) {
 	reviving = true;
 	remainPlayers1 = s_PrisonRules.nRemain1.ToString();
 	remainPlayers2 = s_PrisonRules.nRemain2.ToString();
	reviveMessage = "Revived " + namePlayer + " of team " + team; //TODO: + "\n Revived player xxx"; add param revivedPlayer, by default -1
 	yield WaitForSeconds(gameMessageTime);
 	reviving = false;
}

function OnEnd(teamWinner: int) { //PrisonRules.js send this message for print the event of end of the game, and load the Scene GameOver
	ending = true;
	endMessage = "Game Over: Team " + teamWinner + " wins!";
	yield WaitForSeconds(gameMessageTime);
	ending = false;
	Application.LoadLevel("GameOver"); //we destroy all the objects loaded before
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

function OnPaused(toPause: boolean) {
	paused = toPause;
	if (paused)
		Time.timeScale = 0;
	else {
		//yield; //TODO: if the input to throw/catch the ball is the left mouse button: 
		//continue with mouse will set uncorrectly the player to throw/catch. but the yield no works with SendMessage
		Time.timeScale = 1;
	}
}

