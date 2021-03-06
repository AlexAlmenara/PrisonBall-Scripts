#pragma strict

var guiSkin : GUISkin;
var drawer : GUIDrawer = new GUIDrawer();

var background : Texture2D;
private var backgroundStyle : GUIStyle;
var titleStyle : GUIStyle;
var team1NameStyle : GUIStyle;
var team2NameStyle : GUIStyle;
var scoreStyle : GUIStyle;
var winnerStyle : GUIStyle;

private var winnerMessage : String;
private var scoreMessage : String;

var maxTimeToStart = 30.0; //if spend the max time, return to start menu
private var time = 0.0;//counter of time passed since load this level
private var isWebPlayer = (Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.WindowsWebPlayer);

//element features
//labels
var titleOffset = Vector2(-400, -600);
var scoreOffset = Vector2(-600, -350);
var winnerOffset = Vector2(-300, -150);

//buttons 
var buttonsOffset = Vector2(0, 100);
var buttonWidth = 650;
var buttonsSeparation = 20;
private var menuOffset : Vector2;
private var dataOffset : Vector2;
private var rematchOffset : Vector2;
private var quitOffset : Vector2;

//*** data from PrisonRules ***
private var team1Name : String; //TODO: make independent of size name
private var team2Name : String; //also remainPlayers in reset

private var matchData = false;

function Awake() { //awake is called every load of this scene, so need to use OnLevelWasLoaded()
	backgroundStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background;
	
	time = 0.0; //reset the counter time
	
	var nRemain1 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain1;
	var nRemain2 : int = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).nRemain2;

	team1Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team1Name;
	team2Name = GameObject.Find("/System/PrisonRules").GetComponent(PrisonRules).team2Name;

	scoreMessage = nRemain1 + " - " + nRemain2;
	if (nRemain1 == nRemain2)
		winnerMessage = "           Tie";
	else
	if (nRemain1 > nRemain2)
		winnerMessage = team1Name + " wins!";
	else
		winnerMessage = team2Name + " wins!";
			
	//button offsets
	menuOffset = Vector2(buttonsOffset.x, buttonsOffset.y);
	dataOffset = Vector2(buttonsOffset.x, buttonsOffset.y + drawer.GetButtonHeight() + buttonsSeparation);
	rematchOffset = Vector2(buttonsOffset.x, buttonsOffset.y + 2 * (drawer.GetButtonHeight() + buttonsSeparation));	
	quitOffset = Vector2(buttonsOffset.x, buttonsOffset.y + 3 * (drawer.GetButtonHeight() + buttonsSeparation));
	
	//test:
	/*team1Name = "Blue Team";	
	team2Name = "Red Team";
	scoreMessage = "1 - 0";
	winnerMessage = "Blue Team wins!";*/
	//end test */
}

function OnGUI() {
	if (matchData)
		return;
		
	GUI.skin = guiSkin;
	drawer.IndependentResolution();
	drawer.BackgroundImage(backgroundStyle);

	//****** labels		
	drawer.Label_Center(titleOffset, "End of Match", titleStyle);	
	
	drawer.Label_Center(scoreOffset, team1Name, team1NameStyle); //TODO: change scoreOffset and size of name messages: according to team1Name.size
	drawer.Label_Center(scoreOffset + Vector2(450, -50), scoreMessage, scoreStyle);
	drawer.Label_Center(scoreOffset + Vector2(870, 0), team2Name, team2NameStyle);
	
	drawer.Label_Center(winnerOffset, winnerMessage, winnerStyle);
	
	//****** buttons
	if (drawer.Button_Center(menuOffset, buttonWidth, "Back to menu"))
		Application.LoadLevel("StartMenu");	
	
	if (drawer.Button_Center(dataOffset, buttonWidth, "Match data"))
		SendMessage("OnMatchData", true);
			
	if (drawer.Button_Center(rematchOffset, buttonWidth, "Rematch")) {
		Application.LoadLevel("Ground1");
	}
	
	if (drawer.Button_Center(quitOffset, buttonWidth, "Quit") && !isWebPlayer) { //the button Quit only works in standalone mode	
		print("Quit application");
		Application.Quit(); //it only works in build mode, no in edit mode
	}
		
}

function LateUpdate () {	
	time += Time.deltaTime;
	if (time >= maxTimeToStart) //if spend the max time, return to start menu
		Application.LoadLevel("StartMenu");
}

function OnMatchData(toDraw : boolean) {
	matchData = toDraw;
}

@script ExecuteInEditMode()
