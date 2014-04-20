#pragma strict


var background : GUIStyle;
var gameOverText : GUIStyle; //normal message
var gameOverShadow : GUIStyle; //same message but shadowed


var gameOverScale = 1.69; //draw message twice, so we’ll define two scale variables
var gameOverShadowScale = 1.61;

var message = "Game Over";

//TODO: que se parezca al de StartMenu.js o al reves

function OnGUI() {
	GUI.Label ( Rect( (Screen.width - (Screen.height * 2)) * 0.75, 0, Screen.height * 2, Screen.height), "", background); //style background
	
	GUI.matrix = Matrix4x4.TRS(Vector3(0, 0, 0), Quaternion.identity, Vector3.one * gameOverShadowScale); //style gameOverShadow. scale and render it
	GUI.Label ( Rect( (Screen.width / (2 * gameOverShadowScale)) - 150, (Screen.height / (2 * gameOverShadowScale)) - 40, 300, 100), message, gameOverShadow);
	
	
	GUI.matrix = Matrix4x4.TRS(Vector3(0, 0, 0), Quaternion.identity, Vector3.one * gameOverScale); //normal message. after the shadow message for appear on top of the shadow
	GUI.Label ( Rect( (Screen.width / (2 * gameOverScale)) - 150, (Screen.height / (2 * gameOverScale)) - 40, 300, 100), message, gameOverText);
}


@script ExecuteInEditMode()
