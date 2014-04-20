

class GUIDrawer { //functions of GUI: draw elements of menu

	var buttonHeight : float;
	var nativeHeightResolution : float;
	private var scaledWidthResolution : float;

	function GUIDrawer(resolutionHeight: float, buttonHeight: float) {
		this.nativeHeightResolution = resolutionHeight;
		this.buttonHeight = buttonHeight;
		this.scaledWidthResolution = this.nativeHeightResolution / Screen.height * Screen.width;
	}
 	
 	function GUIDrawer() {
 		buttonHeight = 100.0;
 		nativeHeightResolution = 1200.0;
		scaledWidthResolution = nativeHeightResolution / Screen.height * Screen.width;
 	}
 	
 	function GetResolutionWidth() {  //note that we only need these getters
 		return scaledWidthResolution;
 	}
 	
 	function GetResolutionHeight() {
 		return nativeHeightResolution;
 	}
 	
 	function GetButtonHeight() {
 		return buttonHeight;
 	}
 	
	function IndependentResolution() { // Our GUI is laid out for a 1920 x 1200 pixel display (16:10 aspect). The next line makes sure it rescales nicely to other resolutions.
		GUI.matrix = Matrix4x4.TRS (Vector3(0, 0, 0), Quaternion.identity, Vector3 (Screen.height / nativeHeightResolution, Screen.height / nativeHeightResolution, 1)); 
	}
 	
	//******** draw text label we consider that the position of elements is the bottom-left corner *************
	
	/*function Label_UpLeft(pos : Vector2, text : String, style : GUIStyle) { //draw a text label from the up-left corner of screen + position, with style
		GUI.Label(Rect (pos.x, pos.y, 800, 100), text, style);
	}
	
	function Label_BottomLeft(pos : Vector2, text : String, style: GUIStyle) { //antes: 100, 100
		GUI.Label(Rect (pos.x, nativeHeightResolution - pos.y, 700, 100), text, style); //Label() could be called without style
	}
	
	function Label_BottomRight(pos : Vector2, text : String, style : GUIStyle) {
		GUI.Label(Rect (scaledWidthResolution - pos.x, nativeHeightResolution - pos.y, 700, 100), text, style);
	}
	*/
	
	function Label_UpCenter(pos : Vector2, text : String, style : GUIStyle) { //draw a text label from the up-center of screen + position, with style
		GUI.Label(Rect (pos.x + scaledWidthResolution / 2, pos.y, 700, 100), text, style);
	}
	
	function Label_Center(pos : Vector2, text : String, style : GUIStyle) {  //draw a text label from the center of screen + position, with style
		GUI.Label(Rect (pos.x + scaledWidthResolution / 2, pos.y + nativeHeightResolution / 2, 700, 100), text, style);
	}
	
	function Label_Center(pos : Vector2, text : String) {  //draw a text label from the center of screen + position, with style
		GUI.Label( Rect(pos.x + scaledWidthResolution / 2, pos.y + nativeHeightResolution / 2, 700, 100), text); //XXX
	}
	
	function LongLabel_Center(pos : Vector2, text : String, style : GUIStyle) {  //draw a large text label from the center of screen + position, with style
		GUI.Label(Rect (pos.x + scaledWidthResolution / 2, pos.y + nativeHeightResolution / 2, 1000, 1000), text, style);
	}
	
	
	//******** draw a image from the up-center of screen + position, with style. the pos is the centre of the image by x **************
	
	function BackgroundImage(backgroundStyle : GUIStyle) {
		//GUI.Label ( Rect( (Screen.width - (Screen.height * 2)) * 0.75, 0, Screen.height * 2, Screen.height), "", backgroundStyle);
		GUI.Label ( Rect( (scaledWidthResolution - (nativeHeightResolution * 2)) * 0.75, 0, 
				nativeHeightResolution * 2, nativeHeightResolution), "", backgroundStyle); //the background image fills all the screen
	}
	
	function CenterImage_UpCenter(pos : Vector2, image : Texture2D) {
		GUI.Label(Rect (pos.x + scaledWidthResolution / 2 - image.width / 2, pos.y, image.height, image.width), image);
	}
	
	/*function Image_BottomLeft(pos : Vector2, image : Texture2D) { //draw image from the bottom-left corner + position
		GUI.Label(Rect (pos.x, nativeHeightResolution - image.height - pos.y, image.width, image.height), image);
	}
	
	function Image_BottomRight(pos : Vector2, image : Texture2D) { //draw image from the bottom-right corner + position
		GUI.Label(Rect (scaledWidthResolution - pos.x - image.width, nativeHeightResolution - image.height - pos.y, image.width, image.height), image);
	}*/
	
	//******** draw button: we consider that the position of elements is its center **********************************
	
	function Button_Center(pos : Vector2, width: float, text : String) {
		return GUI.Button( Rect(pos.x + scaledWidthResolution/2 - width/2, pos.y + nativeHeightResolution/2 - buttonHeight/2, width, buttonHeight), text);
	}
	
	function Button_BottomLeft(pos : Vector2, width: float, text : String) {
		return GUI.Button( Rect(pos.x - width/2, nativeHeightResolution - pos.y - buttonHeight/2, width, buttonHeight), text);
	}
	
	function Button_BottomRight(pos : Vector2, width: float, text : String) {
		return GUI.Button( Rect(scaledWidthResolution - pos.x - width/2, nativeHeightResolution - pos.y - buttonHeight/2, width, buttonHeight), text);
	}

};
