#pragma strict

var guiSkin : GUISkin;
var drawer : GUIDrawer = new GUIDrawer();

var background : Texture2D;
private var backgroundStyle : GUIStyle;
var titleStyle : GUIStyle;
var team1NameStyle : GUIStyle;
var team2NameStyle : GUIStyle;
var scoreStyle : GUIStyle;

private var scoreMessage : String;

//element features
//labels
var titleOffset = Vector2(-200, -600);
var scoreOffset = Vector2(-600, -350);

//buttons 
var buttonsOffset = Vector2(0, 100);
var buttonWidth = 650;
var buttonsSeparation = 20;
private var continueOffset : Vector2;
private var dataOffset : Vector2;
private var rematchOffset : Vector2;
private var leaveOffset : Vector2;

//*** data from PrisonRules ***
private var team1Name : String; //TODO: make independent of size name
private var team2Name : String; //also remainPlayers in reset

private var paused = false;
private var matchData = false;

function Awake() { //awake is called every load of this scene, so need to use OnLevelWasLoaded()
	backgroundStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background; //TODO

	team1Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team1Name;
	team2Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team2Name;
	UpdateScore();		
	
	//button offsets
	continueOffset = Vector2(buttonsOffset.x, buttonsOffset.y);
	dataOffset = Vector2(buttonsOffset.x, buttonsOffset.y + drawer.GetButtonHeight() + buttonsSeparation);
	rematchOffset = Vector2(buttonsOffset.x, buttonsOffset.y + 2 * (drawer.GetButtonHeight() + buttonsSeparation));	
	leaveOffset = Vector2(buttonsOffset.x, buttonsOffset.y + 3 * (drawer.GetButtonHeight() + buttonsSeparation));
	
	//test:
	/*team1Name = "Blue Team";	
	team2Name = "Red Team";
	scoreMessage = "1 - 0";
	winnerMessage = "Blue Team wins!";*/
	//end test */
}

function OnGUI() {
	if (!paused || matchData)
		return;
		
	GUI.skin = guiSkin;
	drawer.IndependentResolution();
	drawer.BackgroundImage(backgroundStyle);

	//****** labels		
	drawer.Label_Center(titleOffset, "Pause", titleStyle);	
	
	drawer.Label_Center(scoreOffset, team1Name, team1NameStyle); //TODO: change scoreOffset and size of name messages: according to team1Name.size
	drawer.Label_Center(scoreOffset + Vector2(450, -50), scoreMessage, scoreStyle);
	drawer.Label_Center(scoreOffset + Vector2(870, 0), team2Name, team2NameStyle);

	
	//****** buttons
	if (drawer.Button_Center(continueOffset, buttonWidth, "Continue"))
		SendMessage("OnPaused", false); //send to this script and PrisonHUD.js
	
	if (drawer.Button_Center(dataOffset, buttonWidth, "Match data"))
		SendMessage("OnMatchData", true);
			
	if (drawer.Button_Center(rematchOffset, buttonWidth, "Rematch"))
		Application.LoadLevel("Ground1");
	
	if (drawer.Button_Center(leaveOffset, buttonWidth, "Leave match")) { //the button Quit only works in standalone mode	
		Application.LoadLevel("StartMenu");
	}
		
}

function UpdateScore() {
	var nRemain1 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain1;
	var nRemain2 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain2;
	
	scoreMessage = nRemain1 + " - " + nRemain2;
}

function OnPaused(toPause : boolean) {
	paused = toPause;
	if (paused)
		UpdateScore();
}

function OnMatchData(toDraw : boolean) {
	matchData = toDraw;
}


@script ExecuteInEditMode()
