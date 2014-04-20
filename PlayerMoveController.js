#pragma strict
/* 
 Control movement of player. there three main sections: auto move functions, default situation and ThirdPersonController modified
 
1) Move Functions: lets player rotate and/or move to a target position. it's inspirate int EnemyPoliceGuy.js
2) Default situation: getters and setter of default position and rotation. also Move and IMove to them.
3) It's almost ThirdPersonController.js, but it had been modified:
- commands v, h, run, jump. 
- Update() is now UpdateMove(). The first lines are moved to KeyPlayer. So the function StartJump() has been added.
- functions MoveTo() and IMoveTo: TODO
- SetForwardTransform() to change the forward relative to player or camera
- functions HidePlayer = Dissapear and ShowPlayer = Appear modified
- Quit Slam, Wall
*/


//*** variables of ThirdPersonController ************


var walkSpeed = 3.0; // The speed when walking
var trotSpeed = 4.0; // after trotAfterSeconds of walking we trot with trotSpeed
var runSpeed = 6.0; // when pressing "Fire3" button (cmd) we start running

var rotateSpeed = 4.0; //120.0

var inAirControlAcceleration = 3.0;


var jumpHeight = 0.5; // How high do we jump when pressing jump and letting go immediately
var extraJumpHeight = 2.5; // We add extraJumpHeight meters on top when holding the button down longer while jumping

var gravity = 20.0; // The gravity for the character

var controlledDescentGravity = 2.0; // The gravity in controlled descent mode
var speedSmoothing = 10.0;
var trotAfterSeconds = 3.0;

var canJump = true;
var canControlDescent = true;

private var jumpRepeatTime = 0.05;
private var jumpTimeout = 0.15;
private var groundedTimeout = 0.25;

// The camera doesnt start following the target immediately but waits for a split second to avoid too much waving around.
private var lockCameraTimer = 0.0;

// The current move direction in x-z
private var moveDirection = Vector3.zero;
// The current vertical speed
private var verticalSpeed = 0.0;
// The current x-z move speed
private var moveSpeed = 0.0; //this will be read by PlayerAnimation.js to decide what animation play

// The last collision flags returned from controller.Move
private var collisionFlags : CollisionFlags; 

// Are we jumping? (Initiated with jump button and not grounded yet)
private var jumping = false;
private var jumpingReachedApex = false;

// Are we moving backwards (This locks the camera to not do a 180 degree spin)
private var movingBack = false;
// Is the user pressing any keys?
private var isMoving = false;
// When did the user start walking (Used for going into trot after a while)
private var walkTimeStart = 0.0;
// Last time the jump button was clicked down
private var lastJumpButtonTime = -10.0;
// Last time we performed a jump
private var lastJumpTime = -1.0;


// the height we jumped from (Used to determine for how long to apply extra jump power after jumping.)
private var lastJumpStartHeight = 0.0;


private var inAirVelocity = Vector3.zero;

private var lastGroundedTime = 0.0;

private var lean = 0.0;
private var slammed = false;

private var isControllable = true; //TODO: maybe in KeyPlayer, IA...

// ******* variables by alex, for modify ThirdPersonController *************

private var characterController : CharacterController;
private var forwardTransform : Transform;

//commands from KeyPlayer, IAPlayer or Kinect
private var v : float;
private var h : float;
private var toRun : boolean;
private var toJump : boolean;


//***** variables for MoveTo(), RotateTo(), etc *********************************

static var MAX_TIME = 10.0; //maximum time for auto rotate and move
var angleLookAt = 5.0; //necessary angle to look at a position
//var angleLost = 40.0; //angle that defines that player has lost sight of target

//var goRotateSpeed = 20.0; //speed to rotate while he's walking or running

var stopSpeed = walkSpeed * 0.3; //speed to determinate we should stop moving because we are front of a wall or something

var actionRadius = 3.0; //area in which the player can move around its default position

var reachDistance = 1.3; //0.6; //necessary distance to target position to considerate that we have reached

//**** default situation in PrisonBall **************
private var defPos: Vector3; //default position of player
private var defRot: Quaternion; //default rotation of player

private var isGamer = false; //if the player is controlled by a gamer (key or kinect) or not. We need this variable in StartMoving and EndMoving
private var debug = false; //TODO: quit this


function Awake() { //called before Start of PlayerAnimation
	characterController = GetComponent(CharacterController);
	moveDirection = transform.TransformDirection(Vector3.forward);
	forwardTransform = gameObject.transform; //Camera.main.transform; //by default, forward is relative to the player
	SendMessage("PassiveStart"); //to PlayerSwitchControl. SendMessageOptions.DontRequireReceiver); 
}

function Appear() { //show player: set visible again and reactivate collisions
	//gameObject.layer = 11; //"LayerPlayer"; //gameObject.renderer.enabled = true;
	//GameObject.Find("rootJoint").GetComponent(SkinnedMeshRenderer).enabled = true; // start rendering the player again.
	for (var rend : Renderer in gameObject.GetComponentsInChildren(Renderer, true)) //include inactive = true
		rend.enabled = true;
		
	gameObject.transform.Find("BlobShadowProjector").GetComponent(Projector).enabled = true; //enable shadow
	gameObject.transform.Find("GamerIndicator").renderer.enabled = true;
	//TODO: disable all components or gameObject.collider.enabled = true; //CharacterController inherits from Collider
	isControllable = false;	// disable player controls.
}

function Disappear() { //hide player: set invisible and without collisions
	//GameObject.Find("rootJoint").GetComponent(SkinnedMeshRenderer).enabled = false; // stop rendering the player.
	for (var rend : Renderer in gameObject.GetComponentsInChildren(Renderer)) 
		rend.enabled = false;
		
	gameObject.transform.Find("BlobShadowProjector").GetComponent(Projector).enabled = false; //quit shadow
	gameObject.transform.Find("GamerIndicator").renderer.enabled = false;
	//gameObject.layer = 12; //"LayerIgnoreCamera" //gameObject.renderer.enabled = false;
	//gameObject.collider.enabled = false;
	isControllable = true;	// allow player to control the character again.
}



function Reset() { //TODO: be carefull with last times, maybe quit reset these variables
	isControllable = false;
	yield;	
	
	//forwardTransform = gameObject.transform; //collisionFlags
	lockCameraTimer = 0.0;
	moveDirection = transform.forward; //transform.rotation * Vector3.forward;
	verticalSpeed = 0.0;
	moveSpeed = 0.0; 
	jumping = false;
	jumpingReachedApex = false;
	movingBack = false;
	isMoving = false;
	walkTimeStart = 0.0;
	lastJumpButtonTime = -10.0;
	lastJumpTime = -1.0;
	lastJumpStartHeight = 0.0;
	inAirVelocity = Vector3.zero;
	//lastGroundedTime = 0.0;
	lean = 0.0;
	slammed = false;
	
	yield;
	isControllable = true;
}




function SetGamer(state: boolean) {
	isGamer = state;
	isControllable = state;
	
	if (state) {
		Reset();
		canControlDescent = true;
	}
	else { //set variables for not to be controllable: IAPlayer. for correct animations
		slammed = false;
		jumping = false;
		jumpingReachedApex = false;
		canControlDescent = false;
		//not gamer: IsGroundedWithTimeout() always true
	}
}


function StartMoving(speed: float) { //TODO: if player is a gamer, stop c
	if (isGamer) {
		isControllable = false;	
		//disable kinect, call StopeControl() //not gamer: IsGroundedWithTimeout() always true
	}
	
	yield;
	AutoSpeed(speed);
}

function EndMoving() { //this functions must be called with isControllable = false before
	//isControllable = false; yield;
	AutoSpeed(0);
	yield;
	
	if (isGamer) {
		//print("endmoving: isGamer");
		//TODO: if kinect: enable again Kinect and disable animation: call ReactivateControl()
		lastGroundedTime = Time.time + 2; //for get IsGroundedWithTimeout() to true when reactivate control
		SendMessage("Center"); //to PlayerSwitchControl.js
		yield;// WaitForSeconds(1); //TODO
		Reset(); //inside isControllable = true;
	}
	else
		isControllable = true;
}

function SimpleMove(direction : Vector3) { //although this seems useless, we need call it in KinectGesturesHandler.js
	characterController.SimpleMove(direction);
}

function AngleToPosition(targetPos: Vector3) { //return the angle to the target position. this is the angle we need to rotate to look at position
	var relative = transform.InverseTransformPoint(targetPos);
	return Mathf.Atan2(relative.x, relative.z) * Mathf.Rad2Deg;
}

//**** functions that moves player automatically without inputs. if isGamer, the control will be desactivated the movement ***********

//set the specified rotatio by steps
function RotateTo(targetRotation: Quaternion, speed: float) { //set the rotation (by steps). Angular speed in degrees per sec. No limit of time.
	yield StartMoving(speed);
	
	var step = speed * Time.deltaTime; //Need for be independt of frame rate. speed in m/s. The step size is equal to speed times frame time
	
	while (true) {
		transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, step); //linear interpolattion. print("euler = " + transform.eulerAngles);
		if (Quaternion.Angle(transform.rotation, targetRotation) < angleLookAt) { //difference between rotations
			//print("rotateTo tagetRotation breakk");
			break;
		}
			
		yield;
	}
	
	yield EndMoving();
}

/* Rotate to look at position (by steps). Note that position is fixed, no variable
   inspirated in SmoothLookAt.js. this could have done using Vector3.RotateTowards */
function RotateTo(targetPos : Vector3, speed : float) { 
	yield StartMoving(speed);

	var step = speed * Time.deltaTime;	
	
	var targetRotation = Quaternion.LookRotation(targetPos - transform.position);
	targetRotation.x = transform.rotation.x; //we only want to change the y component, so x and z will be no modified
	targetRotation.z = transform.rotation.z;
	
	while (true) {
		transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, step);
		if (Mathf.Abs(AngleToPosition(targetPos)) <= angleLookAt) { //relative position with enough angle. note that is a different checking
			//print("rotateTo targetPosition breakk");
			break;
		}
		
		yield;
	}
	
	yield EndMoving();
}


//Rotate to look at position and then will move to position. TODO: quit maxTime, only check local constant
function MoveTo(targetPos: Vector3, speed : float, maxTime: float) { //move obj to the position pos, with a maximum time. if time <= 0, no limit of time.
	var time : float = 0.0; //MoveTo
	var step : float;
	var direction : Vector3;
	var distance : float;
	
	yield StartMoving(speed);
	
	//RotateTo(targetPos, walkSpeed) without StartMoving and EndMoving. //transform.LookAt(targetPos);
	step = rotateSpeed * Time.deltaTime;
	var targetRotation = Quaternion.LookRotation(targetPos - transform.position);
	targetRotation.x = transform.rotation.x; //we only want to change the y component, so x and z will be no modified
	targetRotation.z = transform.rotation.z;	
	while (true) {
		transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, step);
		if (Mathf.Abs(AngleToPosition(targetPos)) <= angleLookAt) {
			//print("rotateTo tagetPosition breakk");
			break;
		}
			
		yield;
	}
	
	//Move:
	step = speed * Time.deltaTime;
	while (time < maxTime) { 
		time += Time.deltaTime;	
		
		/*transform.position = Vector3.MoveTowards(transform.position, targetPos, step); //move position a step closer to the target
		if (transform.position == targetPos) { //reach to position. MoveTowards returns the target position when is closer than step
			print("MoveTo: reach to position");
			break;
		}*/
		
		//rotate again for safety: if he finds obstacles we need this
		targetRotation = Quaternion.LookRotation(targetPos - transform.position);
		targetRotation.x = transform.rotation.x;
		targetRotation.z = transform.rotation.z;
		transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, step); 
		
		//move
		direction = transform.TransformDirection(Vector3.forward * speed); //in m/s, no need to use deltaTime
		characterController.SimpleMove(direction);
		
		//check if enough close
		distance = Vector3.Distance(transform.position, targetPos); //(transform.position - targetPos).magnitude
		if ((distance <= step) || (distance <= reachDistance))
			break; //we have reached, so finish*/
						
		if ( ((maxTime > 0) && (time >= maxTime)) || (time >= MAX_TIME))
			break; //end of while
			
		yield;
		// We are not actually moving forward. This probably means we ran into a wall or something. Stop moving
		//if (characterController.velocity.magnitude < stopSpeed) break;
	}
	
	transform.position = targetPos; //IMove: in case of no reach before, set the target position right now
	yield EndMoving();
}

function RotateTo(pos: Vector3) {
	yield RotateTo(pos, rotateSpeed);
}

function RotateTo(rot: Quaternion) {
	yield RotateTo(rot, rotateSpeed);
}

function MoveTo(pos: Vector3, runCommand : boolean, maxTime: float) {
	if (runCommand)
		yield MoveTo(pos, runSpeed, maxTime); //need to yield if outside we want to yield
	else
		yield MoveTo(pos, walkSpeed, maxTime);
	
}


/* Rotate for look at position only during a frame.
   it's a incomplete movement, so we need to call this function several times (one per frame)
   Used only for IAPlayers, so no need to call StartMoving and EndMoving
   Return false if no rotation: the total movement has finished */
function UpdateRotateTo(targetPos: Vector3, speed : float) {
	if (Mathf.Abs(AngleToPosition(targetPos)) <= angleLookAt) {
		moveSpeed = 0;
		return false;
	}
	
	moveSpeed = speed;
	var targetRotation = Quaternion.LookRotation(targetPos - transform.position);
	targetRotation.x = transform.rotation.x; //we only want to change the y component, so x and z will be no modified
	targetRotation.z = transform.rotation.z;
	transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, speed * Time.deltaTime);
	return true;
}

/* Move to position only during a frame.
   it's a incomplete movement, so we need to call this function several times (one per frame)
   Used only for IAPlayers, so no need to call StartMoving and EndMoving
   Return false if no move: the total movement has finished */
function UpdateMoveTo(targetPos: Vector3, speed : float) {
	var step = speed * Time.deltaTime;
	var distance = Vector3.Distance(transform.position, targetPos); 
	if ((distance <= step) || (distance <= reachDistance)) { //if ((transform.position - targetPos).magnitude <= reachDistance) {
		moveSpeed = 0; //AutoSpeed(0); //print("updateMoveTo: reached");
		return false; //we have reached, so finish
	}
	
	moveSpeed = speed;
	
	//rotate. without check angleLookAt. Slerp no exceeds the rotation
	var targetRotation = Quaternion.LookRotation(targetPos - transform.position);
	targetRotation.x = transform.rotation.x; //we only want to change the y component, so x and z will be no modified
	targetRotation.z = transform.rotation.z;	
	transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, step);
	
	//move
	var direction = transform.TransformDirection(Vector3.forward * speed); //in m/s, no need to use deltaTime
	characterController.SimpleMove(direction);		
	return true;
}


function IRotateTo(rotation: Quaternion) { //instant rotate
	StartMoving(0);
	yield;
	transform.rotation = rotation;
	yield;
	EndMoving();
}


function IRotateTo(targetPos: Vector3) { //instant rotate look at position
	StartMoving(0);
	yield;
	transform.LookAt(targetPos);
	yield;
	EndMoving();
}

function IMoveTo(targetPos: Vector3) { //instant move to posicion. if any force, quit it		
	StartMoving(0);
	transform.position = targetPos;
	yield;
	EndMoving();
}



//******** functions relationed with defPos and defRot **************************************

function SetDefaultPosition(pos: Vector3) {
	defPos = pos;
}

function GetDefaultPosition() {
	return defPos;
}

function SetDefaultRotation(rot: Quaternion) {
	defRot = rot;
}

function GetDefaultRotation() {
	return defRot;
}

/*function SetDefaultSituation(pos: Vector3, rot: Quaternion) {
	defPos = pos;
	defRot = rot;
}*/


function IRotateToDefault() {
	IRotateTo(defRot);
}

function RotateToDefault() {
	yield RotateTo(defRot);
}

function IRotateToDefaultBackwards() { //rotate 180 degrees. useful for change the direction of game
	IRotateTo(defRot * Quaternion.Euler(0, 180, 0));
}

function RotateToDefaultBackwards() { //rotate 180 degrees. useful for change the direction of game
	yield RotateTo(defRot * Quaternion.Euler(0, 180, 0));
}

function MoveToDefault(runCommand: boolean, time : float) { //player move to the default position, with a duration of time seconds
	yield MoveTo(defPos, runCommand, time); //yield MoveTo(defPos, false, time); //XXX: walking
}

function MoveToDefault(time: float) {
	yield MoveToDefault(false, time); //walking
}

function IMoveToDefault() {
	IMoveTo(defPos);
}

/*function IMoveRotateToDefault() { //immediate move to the default position and rotation
	StartMoving(0);
	yield;
	transform.rotation = defRot; //IRotate
	transform.position = defPos; //IMove
	yield;
	EndMoving();
}*/ 


//************ functions of ThirdPersonController.js (with modifications) **********


/* Set the forward direction relative to the specified transform.
   if player is controlled by keys the transform will be the camera, in other case will be the player */
function SetForwardTransform(trans: Transform) { 
	forwardTransform = trans;
}


/* in function of the commands v, h and toRun calculates:
 isMoving, movingBack, moveSpeed, moveDirection, inAirVelocity... */
function UpdateSmoothedMovementDirection() {

	var grounded = IsGrounded();
	
	// Forward vector relative to the camera or player along the x-z plane	
	var forward = forwardTransform.TransformDirection(Vector3.forward);
	forward.y = 0;
	forward = forward.normalized;

	// Right vector relative to the camera
	// Always orthogonal to the forward vector
	var right = Vector3(forward.z, 0, -forward.x);

	// Are we moving backwards or looking backwards
	if (v < -0.2)
		movingBack = true;
	else
		movingBack = false;
	
	var wasMoving = isMoving;
	isMoving = Mathf.Abs (h) > 0.1 || Mathf.Abs (v) > 0.1;
		
	// Target direction relative to the camera
	var targetDirection = h * right + v * forward;
	
	// Grounded controls
	if (grounded) {
		// Lock camera for short period when transitioning moving & standing still
		lockCameraTimer += Time.deltaTime;
		if (isMoving != wasMoving)
			lockCameraTimer = 0.0;

		// We store speed and direction seperately,
		// so that when the character stands still we still have a valid forward direction
		// moveDirection is always normalized, and we only update it if there is user input.
		if (targetDirection != Vector3.zero) {
			// If we are really slow, just snap to the target direction
			if (moveSpeed < walkSpeed * 0.9 && grounded)
				moveDirection = targetDirection.normalized;
			else { // Otherwise smoothly turn towards it
				moveDirection = Vector3.RotateTowards(moveDirection, targetDirection, rotateSpeed * Mathf.Deg2Rad * Time.deltaTime, 1000);
				moveDirection = moveDirection.normalized;
			}
		}
		
		// Smooth the speed based on the current target direction
		var curSmooth = speedSmoothing * Time.deltaTime;
		
		// Choose target speed
		//* We want to support analog input but make sure you cant walk faster diagonally than just forward or sideways
		var targetSpeed = Mathf.Min(targetDirection.magnitude, 1.0);
	
		// Pick speed modifier
		if (toRun) //command_run
			targetSpeed *= runSpeed;
		else if (Time.time - trotAfterSeconds > walkTimeStart)
			targetSpeed *= trotSpeed;
		else
			targetSpeed *= walkSpeed;
		
		moveSpeed = Mathf.Lerp(moveSpeed, targetSpeed, curSmooth);
		
		// Reset walk time start when we slow down
		if (moveSpeed < walkSpeed * 0.3)
			walkTimeStart = Time.time;
	}
	else { // In air controls
		if (jumping) // Lock camera while in air
			lockCameraTimer = 0.0;

		if (isMoving)
			inAirVelocity += targetDirection.normalized * Time.deltaTime * inAirControlAcceleration;
	}
}


function StartJump() { //message from KeyPlayer or IAPlayer
	lastJumpButtonTime = Time.time;
}

function ApplyJumping() {
	// Prevent jumping too fast after each other
	if (lastJumpTime + jumpRepeatTime > Time.time)
		return;

	if (IsGrounded()) {
		// Jump
		// - Only when pressing the button down
		// - With a timeout so you can press the button slightly before landing		
		if (canJump && Time.time < lastJumpButtonTime + jumpTimeout) {
			verticalSpeed = CalculateJumpVerticalSpeed (jumpHeight);
			SendMessage("DidJump", SendMessageOptions.DontRequireReceiver);
		}
	}
}


function ApplyGravity() { //if there was a command to jump
	if (isControllable)	{// don't move player at all if not controllable.
	
		// * When falling down we use controlledDescentGravity (only when holding down jump)
		var controlledDescent = canControlDescent && verticalSpeed <= 0.0 && toJump && jumping;
		
		// When we reach the apex of the jump we send out a message
		if (jumping && !jumpingReachedApex && verticalSpeed <= 0.0) {
			jumpingReachedApex = true;
			SendMessage("DidJumpReachApex", SendMessageOptions.DontRequireReceiver);
		}
	
		// * When jumping up we don't apply gravity for some time when the user is holding the jump button
		//   This gives more control over jump height by pressing the button longer
		var extraPowerJump =  IsJumping () && verticalSpeed > 0.0 && toJump && transform.position.y < lastJumpStartHeight + extraJumpHeight;
		
		if (controlledDescent)			
			verticalSpeed -= controlledDescentGravity * Time.deltaTime;
		else if (extraPowerJump)
			return;
		else if (IsGrounded ())
			verticalSpeed = 0.0;
		else
			verticalSpeed -= gravity * Time.deltaTime;
	}
}

function CalculateJumpVerticalSpeed (targetJumpHeight : float) {
	// From the jump height and gravity we deduce the upwards speed 
	// for the character to reach at the apex.
	return Mathf.Sqrt(2 * targetJumpHeight * gravity);
}

function DidJump () {
	jumping = true;
	jumpingReachedApex = false;
	lastJumpTime = Time.time;
	lastJumpStartHeight = transform.position.y;
	lastJumpButtonTime = -10;
}

function UpdateKeyMove(vCommand : float, hCommand : float, runCommand: boolean, jumpCommand : boolean, controllable : boolean) {	
	v = vCommand;
	h = hCommand;
	toRun = runCommand;
	toJump = jumpCommand;
	isControllable = controllable;

	//if (!isControllable)
		//return;
		
	UpdateSmoothedMovementDirection();
	
	// Apply gravity
	// - extra power jump modifies gravity
	// - controlledDescent mode modifies gravity
	ApplyGravity();
	
	ApplyJumping(); // Apply jumping logic
	
	// Calculate actual motion
	//print("MoveDirection = " + moveDirection);
	var movement = moveDirection * moveSpeed + Vector3 (0, verticalSpeed, 0) + inAirVelocity;
	movement *= Time.deltaTime;
	
	// Move the controller
	collisionFlags = characterController.Move(movement);
	
	// Set rotation to the move direction
	if (IsGrounded()) {
		if(slammed) { //TODO: quit this when slam without jump. we got knocked over by an enemy. We need to reset some stuff
			slammed = false;
			characterController.height = 2;
			transform.position.y += 0.75;
		}
		
		transform.rotation = Quaternion.LookRotation(moveDirection);
			
	}	
	else {
		if(!slammed) { //TODO: quit only the if
			var xzMove = movement;
			xzMove.y = 0;
			if (xzMove.sqrMagnitude > 0.001)
				transform.rotation = Quaternion.LookRotation(xzMove);
		}
	}	
	
	// We are in jump mode but just became grounded
	if (IsGrounded()) {
		lastGroundedTime = Time.time;
		inAirVelocity = Vector3.zero;
		if (jumping) {
			jumping = false;
			SendMessage("DidLand", SendMessageOptions.DontRequireReceiver);
		}
	}
}

function SetDebug(state: boolean) { //TODO: quit this
	debug = state;
}

function OnControllerColliderHit (hit : ControllerColliderHit) {
	if (hit.moveDirection.y > 0.01) // Debug.DrawRay(hit.point, hit.normal);
		return;
}

function AutoSpeed(speed : float) {
	if (!isGamer || !isControllable)
		moveSpeed = speed;
}

function GetSpeed() { //current speed. important for send to PlayerAnimation
	return moveSpeed;
}

function IsJumping() {
	return jumping && !slammed;
}

function IsGrounded() {
	return (collisionFlags & CollisionFlags.CollidedBelow) != 0;
}

function IsControllable() {
	return isControllable;
}

function SetControllable(state: boolean) {
	isControllable = state;
}

function GetDirection() {
	return moveDirection;
}

function IsMovingBackwards() {
	return movingBack;
}

function GetLockCameraTimer() { //XXX
	return lockCameraTimer;
}

function IsMoving ()  : boolean {
	return Mathf.Abs(v) + Mathf.Abs(h) > 0.5;
}

function HasJumpReachedApex () {
	return jumpingReachedApex;
}

function IsGroundedWithTimeout () {
	if (isGamer && isControllable)
		return lastGroundedTime + groundedTimeout > Time.time;
	else
		return true; //XXX: for the time being, if IAPlayer, no jump.
}

function IsControlledDescent() {
	// * When falling down we use controlledDescentGravity (only when holding down jump)
	//var jumpButton = Input.GetButton("Jump");
	return canControlDescent && verticalSpeed <= 0.0 && toJump && jumping;
}

/*function Reset ()
{
	gameObject.tag = "Player";
}*/



function OnDrawGizmosSelected () { //in scene view for debugging: draw sphere of radius to catch ball. 
	Gizmos.color = Color.blue;
	//Gizmos.DrawWireSphere(transform.position, actionRadius); 
	Gizmos.DrawWireSphere(transform.position, reachDistance); 
}


//TODO or not
//function UpdateSmoothedMovement(direction: Vector3)

// Require a character controller to be attached to the same game object
@script RequireComponent(PlayerAnimation);
@script RequireComponent(CharacterController)

@script AddComponentMenu("Third Person Player/Player Move Controller")
