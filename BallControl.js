#pragma strict
//inspirado en Pickup.js


//private var used = false;
//private var mover : DroppableMover;
var layerGround = 8;
var layerBall = 9;

//var power = 1000;
//var direction : Vector3;
private var caught = false; //if catched by a player
private var grounded = false; //if touched the ground
private var wasOut = false; //if touch the invisible planes: out from the ground
private var groundC: GroundControl; //type Script, that controls the dimensions of the ground and has the getArea() function
private var prisonRules: GameObject;//s_PrisonRules : PrisonRules;

function Start () {
	// do we exist in the level or are we instantiated by an enemy dying?
	//mover = GetComponent(DroppableMover);
	//Physics.IgnoreCollision(gameObject.collider, GameObject.Find("Terrain").collider);
	groundC = GameObject.FindWithTag("Ground").GetComponent(GroundControl);
	prisonRules = GameObject.FindWithTag("PrisonRules"); //.GetComponent(PrisonRules);
	SetPhysics(true); //actica fisica de pelota, para que le afecte gravedad etc
	
	//ignora colisiones con los limites invisibles del campo
	Physics.IgnoreLayerCollision(layerGround, layerBall, true); //LayerGround, LayerBall
	//gameObject.SetActiveRecursively(false); //by the moment ball disable. wait to message ShowBall() from PrisonRules.js
}


/*function ShowBall(initPos : Vector3) {
	transform.position = initPos;
	//gameObject.SetActiveRecursively(true);
}*/

//realmente no hace falta por ahora, mas bien para hacer pruebas
/*function Update() 
{
	print(this.GetArea());
}*/

function IsGrounded() {
	return grounded;
}


function SetCaught(state: boolean) { //set true or false if ball is caught by a player
	SetPhysics(!state); 
	caught = state;
	
	if (state) { //catch the ball cancels the grounded state
		grounded = false;
		wasOut = false;
	}
}

function IsCaught() { //devuelve si esta cogida
	return caught;
}

//devuelve area en la que esta la pelota
function GetArea() {
	return groundC.GetArea(transform.position);
}

//add force to the ball for be thrown with a specified power and direction
function ThrowToDirection(power : float, direction : Vector3) {
	gameObject.rigidbody.AddForce(direction * power);
}

/*function ThrowToPosition(power : float, position : Vector3) {
	var direction = position - transform.position; //heading vector
	direction = direction / direction.magnitude; //final direction = heading / distance
	rigidbody.AddForce(direction * power);
}*/

function IMoveTo(pos: Vector3) { //instant move to posicion. if any force, quit it
	//rigidbody.velocity = Vector3.zero; //no force, no velocity. XXX: no natural, also get error	
	transform.position = pos;
}



//activa/desactiva la fisica de la pelota, es decir, si le afecta la gravedad etc. util para que el personaje suba la pelota.
function SetPhysics(state: boolean) {
	this.rigidbody.isKinematic = !state;
}

/* function OnTriggerEnter (col : Collider) {
	
	//* Make sure we are running into a player
	//* prevent picking up the trigger twice, because destruction
	//  might be delayed until the animation has finished
	if (used || playerStatus == null)
		return;

	//if (used)
		//return;

	//if (col.CompareTag("Terrain")) //ignora trigger con suelo
		//return;

	var limit = GameObject.Find("FuellLimit");
	if (limit != null)
		if (! limit.GetComponent(ControlLimits).limitsActivated) { //comprueba que limites del campo desactivados
		
		
	//used = true;
	
	ThrowBall(power, direccion);

	//if (sound)
	//	AudioSource.PlayClipAtPoint(sound, transform.position, soundVolume);
	
} */


//true si la pelota esta fuera de la zona de juego por la parte del equipo 1
function isOut1() {
	return groundC.GetArea(transform.position) == groundC.OUT1;
}

//true si la pelota esta fuera de la zona de juego por la parte del equipo 1
function isOut2() {
	return groundC.GetArea(transform.position) == groundC.OUT2;
}


function Reset() {
	caught = false;
	grounded = false;
	wasOut = false;
	SetPhysics(true);
	/*used = false;
	if (collider == null)	
		gameObject.AddComponent(BoxCollider);
	collider.isTrigger = true;*/
}


function OnCollisionEnter(col: Collision) { //if ball touches the terrain or the invisible walls outside the ground
	/*if ((!grounded) && ( (col.collider.CompareTag("Terrain")) || (col.collider.CompareTag("Wall")) ) ) { 
		grounded = true; //because a waitforseconds can't simulate this behaviour
		s_PrisonRules.OnBallGroundedOrOut();
	}*/
	
	print("Ball: OnCollisionEnter. wasOut = " + wasOut + ", grounded = " + grounded + ", caught = " + caught + ", collider.tag = " + col.collider.tag);
	
	//if (!caught)	: maybe not enough time to see correctly !catched after thrown
	//note that if someone is being burning PrisonRules.js will decide to do nothing
	
	if (!grounded || !wasOut) {
		if (col.collider.CompareTag("Terrain")) { //Ball collide with Terrain
			grounded = true; 
			prisonRules.SendMessage("OnBallGrounded", SendMessageOptions.RequireReceiver);
		}
	}
	
	if (!wasOut) { // for not to send a lot of this messages
		if (col.collider.CompareTag("Plane1")) { //Ball collide with invisible Plane1
			grounded = true;
			wasOut = true;
			prisonRules.SendMessage("OnBallOut1", SendMessageOptions.RequireReceiver);
		}
		else
		if (col.collider.CompareTag("Plane2")) { //Ball collide with invisible Plane2;
			grounded = true;
			wasOut = true;
			prisonRules.SendMessage("OnBallOut2", SendMessageOptions.RequireReceiver);
		}
	}
	
}
