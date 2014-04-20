#pragma strict

var guiSkin : GUISkin;
var drawer : GUIDrawer = new GUIDrawer();

var background : Texture2D;
private var backgroundStyle : GUIStyle;
var titleStyle : GUIStyle;
var team1NameStyle : GUIStyle;
var team2NameStyle : GUIStyle;
var scoreStyle : GUIStyle;
var dataStyle : GUIStyle;

private var scoreMessage : String;

private var matchData = false;

//element features
//labels
var titleOffset = Vector2(-200, -600);
var scoreOffset = Vector2(-600, -350);
var dataOffset = Vector2(-650, -100);

//button
var backOffset = Vector2(0, 300);

//*** data from PrisonRules ***
private var team1Name : String; //TODO: make independent of size name
private var team2Name : String; //also remainPlayers in reset


function Awake() { //awake is called every load of this scene, so need to use OnLevelWasLoaded()
	backgroundStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background; //TODO

	team1Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team1Name;
	team2Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team2Name;
	UpdateScore();		
	
	//test:
	/*team1Name = "Blue Team";	
	team2Name = "Red Team";
	scoreMessage = "1 - 0";
	winnerMessage = "Blue Team wins!";*/
	//end test */
}

function OnGUI() {
	if (!matchData)
		return;
		
	GUI.skin = guiSkin;
	drawer.IndependentResolution();
	drawer.BackgroundImage(backgroundStyle);

	//****** labels		
	drawer.Label_Center(titleOffset, "Match Data", titleStyle);	
	
	drawer.Label_Center(scoreOffset, team1Name, team1NameStyle); //TODO: change scoreOffset and size of name messages: according to team1Name.size
	drawer.Label_Center(scoreOffset + Vector2(450, -50), scoreMessage, scoreStyle);
	drawer.Label_Center(scoreOffset + Vector2(870, 0), team2Name, team2NameStyle);

	drawer.LongLabel_Center(dataOffset, "No data released yet. \n Wait for next version", dataStyle);
	
	
	//****** button
	if (drawer.Button_Center(backOffset, 300, "Back"))
		SendMessage("OnMatchData", false);
		
}

function UpdateScore() {
	var nRemain1 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain1;
	var nRemain2 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain2;
	
	scoreMessage = nRemain1 + " - " + nRemain2;
}

function OnMatchData(toDraw : boolean) {
	matchData = toDraw;
	if (matchData)
		UpdateScore();
}


@script ExecuteInEditMode()
