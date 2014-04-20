#pragma strict

var guiSkin : GUISkin;

var drawer : GUIDrawer = new GUIDrawer();

private var isWebPlayer = (Application.platform == RuntimePlatform.OSXWebPlayer || Application.platform == RuntimePlatform.WindowsWebPlayer);

private var currentScreen = 1; //1: start, 2: how to play
var background : Texture2D; // our backdrop image goes in here
private var backgroundStyle : GUIStyle;

var titleStyle : GUIStyle;
var howStyle: GUIStyle;

//screen 1
var titleOffset = Vector2(-350, -400);
var startOffset = Vector2(0, 200);
var howOffset = Vector2(100, 100);

//screen 2
var howTitleOffset = Vector2(-350, -500);
var howTextOffset = Vector2(-300, -200);
var backOffset = Vector2(0, 300);

function Awake() {
	backgroundStyle = new GUIStyle(); //override the default GUI Skin style. it changes the “normal.background” style element to use our backdrop image.
	backgroundStyle.normal.background = background;
	
}


function OnGUI() {
	GUI.skin = guiSkin;
	drawer.IndependentResolution();
	drawer.BackgroundImage(backgroundStyle);
		
	if (currentScreen == 1)
		Screen1_Start();
	else
		Screen2_How();
}


function Screen1_Start() {
	drawer.Label_Center(titleOffset, "Prison Ball", titleStyle); //"mainMenuTitle"); //the title of the menu
	
	if (drawer.Button_Center(startOffset, 300, "Play"))
		Application.LoadLevel("ModeMenu"); // load the game level.
	
	
	//button Quit
	if (!isWebPlayer) { //the button Quit only works in standalone mode. if is Web, we could argue to close the browser
		if (drawer.Button_Center(startOffset + Vector2(0, 150), 300, "Quit")) {
			print("Quit application");
			Application.Quit(); //it only works in build mode, no in edit mode
		}
	}

	if (drawer.Button_BottomRight(howOffset, 100, "?")) //button How to Play
		currentScreen++;
}


function Screen2_How() {
	drawer.Label_Center(howTitleOffset, "How to play", titleStyle);
	drawer.LongLabel_Center(howTextOffset, "No writen yet. \n Wait for the next version \n PrisonRules 1 . 0 Beta \n 2013, Alex Almenara", 
		howStyle); //GUI.skin.GetStyle("Label"));
	
	if (drawer.Button_Center(backOffset, 300, "Back"))
		currentScreen--;
}



@script ExecuteInEditMode() // Make the script also execute in edit mode
