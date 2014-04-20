#pragma strict

//parametros: dimensiones
var width = 12; //ancho de la cancha
var heightGame1 = 6; //zonas de juego normal
var heightGame2 = 6;
var heightBurned1 = 4; //zonas de brilado
var heightBurned2 = 4;
private var height : int; //heightBurned1 + heightBurned2 + heightGame1 + heightGame2;

var planeY = 0.02; //the position.y of the invisible planes. they need to be a bit higher than the terrain: the ball will collide for know if it's outside the ground
var heightPlane = 10;

var layerGround = 8;
var layerIgnoreGround = 10; //layer to set to the burning player for cross the limits and go to the new position

/*private var AREA = { //areas de juego
	"OUT2" : -2, 
	"BURNED2" : 3, 
	"GAME2" : 2,
	"GAME1" : 1,
	"BURNED1" : 0,
	"OUT1" : -1 
};*/

//game areas
static var OUT2 = -2; //also main areas: AREA1 = 1, AREA2 = 2, but no need to define.
static var BURNED2 = 22;
static var GAME2 = 2;
static var GAME1 = 1;
static var BURNED1 = 11;
static var OUT1 = -1;

private var limitsActivated = true;

private var firstLimitWidth : float; //initial dimensions, that will be usual for the scale of the ground
private var firstLimitHeight : float;
private var firstPlaneWidth : float;
private var firstPlaneHeight : float;

//reference to objects that we need

//limits
private var ground : Transform; //this.transform
private var limitEnd1 : Transform;
private var limitInside1 : Transform;
private var limitCenter : Transform;
private var limitInside2 : Transform;
private var limitEnd2 : Transform;
private var limitLeft : Transform;
private var limitRight : Transform;

//invisible planes outside the the limits
private var planeEnd1 : Transform; //note: each of the planes have a Mesh Renderer only for debugging, normally are disabled
private var planeEnd2 : Transform;
private var planeLeft1 : Transform;
private var planeLeft2 : Transform;
private var planeRight1 : Transform;
private var planeRight2 : Transform;

function UpdateDimensions() { //actualiza las dimensiones del campo: dimensiona y coloca limites

	height = heightBurned1 + heightBurned2 + heightGame1 + heightGame2;

	//var limit = this.transform.Find("HLimitCenter/LimitRender"); //limit.transform.localScale.z = width / limit.parent.lossyScale.z;

	//horizontal limits
    limitEnd1.localScale.x = width / firstLimitWidth; //scale to the width
	limitEnd1.position = ground.position; //place in the proper position
		 
	limitInside1.localScale.x = width / firstLimitWidth;
	limitInside1.position = ground.position + Vector3.forward * heightBurned1;
	
	limitCenter.localScale.x = width / firstLimitWidth;
	limitCenter.position = ground.position + Vector3.forward * (heightBurned1 + heightGame1);
	 
	limitInside2.localScale.x = width / firstLimitWidth;
	limitInside2.position = ground.position + Vector3.forward * (heightBurned1 + heightGame1 + heightGame2);
	
	limitEnd2.localScale.x = width / firstLimitWidth;
	limitEnd2.position = ground.position + Vector3.forward * height;
	
	
	//vertical limits
	limitLeft.localScale.z = height / firstLimitHeight; //scale to the height
	limitLeft.position = ground.position; //place in the proper position
	
	limitRight.localScale.z = height / firstLimitHeight;
	limitRight.position = ground.position + Vector3.right * width;
	
		
	//planes
	planeEnd1.localScale.x = width / firstPlaneWidth; //scale to the same width of ground
	planeEnd1.localScale.z = heightPlane / firstPlaneHeight; //scale to the specific heightPlane
	planeEnd1.position = limitEnd1.position;
	planeEnd1.position.y = planeY;
	
	planeEnd2.localScale.x = width / firstPlaneWidth;
	planeEnd2.localScale.z = heightPlane / firstPlaneHeight;
	planeEnd2.position = limitEnd2.position;
	planeEnd2.position.y = planeY;
	
	planeLeft1.localScale.x = width / firstPlaneWidth;
	planeLeft1.localScale.z = heightPlane / firstPlaneHeight;
	planeLeft1.position = limitCenter.position;
	planeLeft1.position.y = planeY;
	
	planeLeft2.localScale.x = width / firstPlaneWidth;
	planeLeft2.localScale.z = heightPlane / firstPlaneHeight;
	planeLeft2.position = limitCenter.position;
	planeLeft2.position.y = planeY;
	
	planeRight1.localScale.x = width / firstPlaneWidth;
	planeRight1.localScale.z = heightPlane / firstPlaneHeight;
	planeRight1.position = limitCenter.position + Vector3(width, 0, 0);
	planeRight1.position.y = planeY;
	
	planeRight2.localScale.x = width / firstPlaneWidth;
	planeRight2.localScale.z = heightPlane / firstPlaneHeight;
	planeRight2.position = limitCenter.position + Vector3(width, 0, 0);
	planeRight2.position.y = planeY;	
	
	yield;
}


function Start () {
	ground = this.transform;
	//take the initial dimensions, that will be usual for the scale of the ground
	firstLimitWidth = this.transform.Find("Limits/HLimitEnd1/Limit").renderer.bounds.size.x;
	firstLimitHeight = this.transform.Find("Limits/VLimitLeft/Limit").renderer.bounds.size.z;
	
	firstPlaneWidth = this.transform.Find("Planes/Plane1/PlaneEnd1/Plane").renderer.bounds.size.x;
	firstPlaneHeight = this.transform.Find("Planes/Plane1/PlaneEnd1/Plane").renderer.bounds.size.z; //don't worry to find the same again, it's only at the start
	
	//print("planeWidth = " + firstPlaneWidth  + ", planeHeight = " + firstPlaneHeight);
	//print("div width = " + width / firstPlaneWidth + ", div height = " + height / firstPlaneHeight);
	//search the limits for later use
	limitEnd1 = GameObject.Find("/Ground/Limits/HLimitEnd1").transform; //limitEnd1 = this.transform.Find("HLimitEnd1").transform;
	limitInside1 = GameObject.Find("/Ground/Limits/HLimitInside1").transform;
	limitCenter = GameObject.Find("/Ground/Limits/HLimitCenter").transform;
	limitInside2 = GameObject.Find("/Ground/Limits/HLimitInside2").transform;
	limitEnd2 = GameObject.Find("/Ground/Limits/HLimitEnd2").transform;
	limitLeft = GameObject.Find("/Ground/Limits/VLimitLeft").transform;
	limitRight = GameObject.Find("/Ground/Limits/VLimitRight").transform;
	
	//search the invisible planes
	planeEnd1 = GameObject.Find("/Ground/Planes/Plane1/PlaneEnd1").transform;
	planeEnd2 = GameObject.Find("/Ground/Planes/Plane2/PlaneEnd2").transform;
	planeLeft1 = GameObject.Find("/Ground/Planes/Plane1/PlaneLeft1").transform;
	planeLeft2 = GameObject.Find("/Ground/Planes/Plane2/PlaneLeft2").transform;
	planeRight1 = GameObject.Find("/Ground/Planes/Plane1/PlaneRight1").transform;
	planeRight2 = GameObject.Find("/Ground/Planes/Plane2/PlaneRight2").transform;
	
	yield UpdateDimensions();
	yield SetStateLimits(true);
	Physics.IgnoreLayerCollision(layerGround, layerIgnoreGround, true); 
	GameObject.FindWithTag("PrisonRules").SendMessage("PassiveStart"); //when the ground is defined, then will create the players and place them
}


/*function Update()  {
	//UpdateDimensions(); //solo de prueba. lo mejor es mandar un Message("UpdateDimensions") cuando haga falta.
}*/


//activa/desactiva los limites de la cancha. util para que los jugadores cambien de area	
function SetStateLimits(state : boolean)  {
	/*var colliders : Component[];
	colliders = this.GetComponentsInChildren(Collider); //recorre todos lo colliders de la cancha, los limites
	for (var col2 : Collider in colliders) { //XXX: be carefull, also the walls
		col2.enabled = state;
	}*/
	/*var limits : GameObject[];
	limits = ground.FindGameObjectsWithTag("Limit");
	for (var lim : GameObject in limits)
		lim.collider.enabled = state;*/
		
	limitEnd1.Find("Limit").collider.enabled = state;
	limitInside1.Find("Limit").collider.enabled = state;
	limitCenter.Find("Limit").collider.enabled = state;
	limitInside2.Find("Limit").collider.enabled = state;
	limitEnd2.Find("Limit").collider.enabled = state;
	limitLeft.Find("Limit").collider.enabled = state;
	limitRight.Find("Limit").collider.enabled = state;
	
	limitsActivated = state;
	
	yield;
}

function IgnoreCollision(obj: GameObject, state : boolean) {
	if (state)
		obj.layer = layerIgnoreGround; //player will may cross the limits
	else
		obj.layer = 0; //default layer, crossing not allowed
}

function Reset() {
	UpdateDimensions();
	SetStateLimits(true);
}



function GetArea(pos : Vector3) { //get the area where the object is, his position is pos.
	if (pos == null) {
		print("error: pos null");
		return OUT1;
	}
	
	//if (limitLeft.position == null) print("limit null");
		
	//check if out by the lateral sides (pos.x)
	if ((pos.x < limitLeft.position.x) || (pos.x > limitRight.position.x)) {
		if (pos.z < limitCenter.position.z)
			return OUT1;
		else
			return OUT2;
	}
		
	
	//checking sequentially each area: by pos.z
	if (pos.z < ground.position.z) // equal to limitEnd1.position.z
		return OUT1;
		
	if (pos.z < limitInside1.position.z)
		return BURNED2;
	
	if (pos.z < limitCenter.position.z)
		return GAME1;
		
	if (pos.z < limitInside2.position.z)
		return GAME2;
		
	if (pos.z < limitEnd2.position.z)
		return BURNED1;
		
	return OUT2;
}

/* Get the main where the object is. it could be 1 or 2. also 0 for out. 
   Note that we no distinguish between out1 and out2, burned1 and game1 */
/*function GetMainArea(pos: Vector3) { 
	if (pos == null) {
		print("error: pos null");
		return OUT1;
	}
	
	if ((pos.x < limitLeft.position.x) || (pos.x > limitRight.position.x) || (pos.z < ground.position.z))
		return 0; //out 1 or out by lateral sides
	
	if (pos.z < limitCenter.position.z)
		return 1;
	
	if (pos.z < limitEnd2.position.z)
		return 2;
	
	return 0; //out 2
}*/


/*devuelve posicion inicial de jugador en un area (Vector3) (posicion global)
   area: area del campo donde situar
   n: numero actual de jugadores en dicha area
   i: numero de orden de jugador segun n (de 0 a n-1)
 */
function GetPosition(area: int, n: int, i: int) {
	
	var pos : Vector3; //posicion del jugador a devolver
	var areaHeight: float;
	
	switch (area) {
		
		case BURNED2:
			pos = limitEnd1.position; // = this.transform.position;
			areaHeight = heightBurned1;
			break;
		
		case GAME1: 
			pos = limitInside1.position; 
			areaHeight = heightGame1;
			break;
			
		case GAME2: 
			pos = limitCenter.position; 
			areaHeight = heightGame2;
			break;
			
		case BURNED1: 
			pos = limitInside2.position; 
			areaHeight = heightBurned2;
			break;
			
		default: 
			print("no area selected for the player "); 
			pos = ground.position - Vector3.forward * 2 * i;
	} //switch
	
	switch (n) { //no hace falta controlar cuando se pasa de rango, eso ya se controla en Start() de PrisonRules.js
		//TODO case 3: break;
		case 5: break;
		
		case 1: case 2: case 3:
			//print("case 1 2 3 ");
			pos.x += (width/(n + 1)) * (i + 1);
			pos.z += areaHeight/2; //los reparte en una sola fila
			break;
			
		case 4: case 6:	//los reparte en dos filas iguales
			//print("case 4 6");
			if (i < n/2) {
				pos.x += (width/(n/2 + 1)) * (i + 1);
				pos.z += areaHeight/3; //primera fila (mas abajo)
			}
			else {
				pos.x += (width/(n/2 + 1)) * (i - n/2 + 1); //(Mathf.Round(i-1/2.0) + 1);
				pos.z += (areaHeight/3) * 2; //segunda fila (mas arriba)
			}
			
			break;
	
		default: 
			print("number n invalid");
			pos.x += 2 * i;
	} //switch
	
	pos.y = 0;
	return pos; //return transform.TransformPoint(pos);
}


function GetPosition(object: GameObject, area: int, n: int, i: int) { //as previous GetPosition function, but the pos.y is not changed
	var pos : Vector3 = GetPosition(area, n, i);
	pos.y = object.transform.position.y;
	return pos;
}
/*function OnTriggerEnter(col: Collider) {

	print("Ground: OnTriggerEnter");
	if (col.CompareTag("Ball")) {
		var s_PrisonRules = GameObject.FindWithTag("PrisonRules").GetComponent(PrisonRules);
		print("plane collide with ball: ball out");
		yield WaitForSeconds(2);//timeGrounded); //time to see how ball touches the terrain (more realistic)
		s_PrisonRules.OnBallOut();
	}
}


function OnCollisionEnter(col: Collision) {
	print("Ground: OnCollionEnter");
}*/