#pragma strict

//inspirated in HandRaiseDetector.cs of Zigfu and KinectWrapper.cs of Microsoft Kinect

//note that this script must be in the same object that KinectGesturesHandler.cs
private var trackedUser : ZigTrackedUser;
private var player: GameObject;

private var busy = false; //gestures can't be recognized because of reasons: user attach or detach, time for one gesture
var timeNextGesture = 1.5; //need a time between gestures to avoid continuous detections

var leftHanded = false; //if player is left-handed

//joints (updated each frame)
var rightHand : ZigInputJoint;
var leftHand : ZigInputJoint;
var rightElbow : ZigInputJoint;
var leftElbow : ZigInputJoint;
var neck : ZigInputJoint;
var waist : ZigInputJoint;


class Gesture {
	var state : int = 0; //0: completed, waiting for reinitialize. 1, 2...: different states of gesture
	
	function IsCompleted() { //if state is 0, gesture is completed, waiting to start
		return !state;
	}
};

class GestureHandRaise extends Gesture { //gesture Raise Hand
	var angleThreshold = 30.0; // degrees
};

var gesture_HandRaise : GestureHandRaise;

class GestureIncline extends Gesture { //gesture incline neck from waist
	var offsetToMove = 60.0; //0.1; //minimum difference between neck and waist for move player
};

var gesture_Incline : GestureIncline;


class GestureThrow extends Gesture { //gesture throw ball. states: 1 calculate the back position of hand. 1: 
	//fixed minimum distances to know when do actions
	var backDistanceToStart : float = 100.0; //minimum distance of hand back from waist to start the gesture
	var deltaMove : float = 55.0; //minimum distance to considerate that the hand continues moving without noise
	var minDistanceThrow : float = 700.0; //minimum distance of total movement to considerate that the gesture is completed
	var maxDistanceThrow : float = 1100.0; //maximum distance of total movement. only need this for clamp the final power
	
 	//positions of hand to determinate the direction of thrown
	var backHandPosition : Vector3; //deepest position of hand at backwards
	var frontHandPosition : Vector3; //end position of gesture, the frontest position of hand
	
	//times for determinate the power of thrown
	var backTime : float; //time when hand was at its deepest position at backwards
	var frontTime : float; //time when finish the gesture, the hand at the front position
	
	//range of 1/time of thrown (fronTime - backTime). needed for clamp the final power
	var minInverseTime : float = 0.1; //var minTime : float = 0.0001; 
	var maxInverseTime : float = 5.0; //var maxTime : float = 3.5;
};

var gesture_Throw : GestureThrow;

class GestureCatch extends Gesture { //gesture try catch ball with two hands
	var minOffset = 150.0; //0.03; //range of distance for be able to catch. distance in x axis, separation of hands
	var maxOffset = 325.0; //0.2;
	
	var lineOffset = 80; //hands must be in parallel, forming a line. this is the minimum distance in axis y and z.
};

var gesture_Catch : GestureCatch;


// Use this for initialization
function Awake () {
	gesture_HandRaise = new GestureHandRaise();
	gesture_Incline = new GestureIncline();
	gesture_Throw = new GestureThrow();
	gesture_Catch = new GestureCatch();
}


function GestureDetected() {
	busy = true;
	yield WaitForSeconds(timeNextGesture);
	busy = false;
}

function UpdateJoints() {
	rightHand = trackedUser.Skeleton[ZigJointId.RightHand];
	leftHand = trackedUser.Skeleton[ZigJointId.LeftHand];
	rightElbow = trackedUser.Skeleton[ZigJointId.RightElbow];
	leftElbow = trackedUser.Skeleton[ZigJointId.LeftElbow];
	
	neck = trackedUser.Skeleton[ZigJointId.Neck];
	waist = trackedUser.Skeleton[ZigJointId.Waist];
}

function SetPlayer(player: GameObject) { //update the user
	this.player = player;
}

function OnUserAttach(user: ZigTrackedUser) { //called from KinectEngageUsers. before was Zig_Attach
	busy = true;
	print("GesturesDetector: Zig Attach");
    trackedUser = user;
    yield;
    busy = false;
}

function OnUserDetach(user: ZigTrackedUser) { // before was Zig Detach
	busy = true;
	print("GesturesDetector: Zig Detach");
    trackedUser = null;
    yield;
    busy = false;
}

/*void Zig_UpdateUser(ZigTrackedUser user) //call it evert frame
{
    trackedUser = user;
}*/


//************ Detector hand raise ****************************

function IsHandRaise(handPosition : Vector3, elbowPosition : Vector3) : boolean {
    var torso : ZigInputJoint = trackedUser.Skeleton[ZigJointId.Torso];
    var head : ZigInputJoint = trackedUser.Skeleton[ZigJointId.Head];

    var armDirection : Vector3 = (handPosition - elbowPosition).normalized;
    var torsoDirection : Vector3 = (head.Position - torso.Position).normalized;
    var angle : double = Mathf.Acos(Vector3.Dot(armDirection, torsoDirection)) * 180 / Mathf.PI;
    return (angle < gesture_HandRaise.angleThreshold);
}

/*bool IsHandRaise2(Vector3 handPosition, Vector3 elbowPosition) {
	return handPosition.y > elbowPosition.y;
}*/

function Detector_RightHandRaise() {
	var power = 0.4; //40.0; //TODO change power
    if (IsHandRaise(rightHand.Position, rightElbow.Position)) {
		//print("Detector Right Hand Rise");
		GestureDetected();
        gameObject.SendMessage("Handler_ThrowBall", power); //OnHandRaise(ZigJointId.RightHand);
	}
}
	
function Detector_LeftHandRaise() {
	var power = 0.2; //20.0; //TODO change power
    if (IsHandRaise(leftHand.Position, leftElbow.Position)) {
		//print("Detector Left Hand Rise");
		GestureDetected();
        gameObject.SendMessage("Handler_Pass", power); //OnHandRaise(ZigJointId.RightHand);
	}
}

//************ Detector incline for Move ****************************

function Detector_Incline() {
	
	var diff = neck.Position - waist.Position; //var upJoint; var downJoint;
	
	//var diff = player.transform.InverseTransformPoint(neck.Position - waist.Position); //este funciona peor: 
	/*var upJoint = player.transform.InverseTransformPoint(neck.Position); //diff3
	var downJoint = player.transform.InverseTransformPoint(waist.Position);
	var diff = upJoint - downJoint; //the difference between joints will be the direction*/
	//print("diff = " + diff); //print("diff = " + diff + ", diff2 = " + diff2 + ", diff3 = " + diff3);
	
	if ((Mathf.Abs(diff.x) >= gesture_Incline.offsetToMove) || (Mathf.Abs(diff.z) >= gesture_Incline.offsetToMove)) {
		var direction = Vector2(Mathf.Sign(diff.x), Mathf.Sign(diff.z));
		//var direction = Vector2(diff.x, diff.z);
		gameObject.SendMessage("Handler_Move", direction);
		GestureDetected();
	}

}


//************ Detector throw ball ****************************

function SetLeftHanded(state : boolean) {
	leftHanded = state;
}

function EnoughDistance(pos1: float, pos2: float, minDistance: float) { //return true if positions are enough far by a min distance. positions are only an axis
	return Mathf.Abs(pos1 - pos2) >= minDistance;
}

function EnoughDistanceZ(pos1: Vector3, pos2: Vector3, minDistance: float) { //check only the z axis
	return Mathf.Abs(pos1.z - pos2.z) >= minDistance; //XXX: be carefull if hand change of sign of position
}

function EnoughDistanceZ(pos: Vector3, minDistance: float) { //check only the z axis
	return Mathf.Abs(pos.z) >= minDistance; //XXX: be carefull if hand change of sign of position
}


//calculate the input power in the range of PlayerBallController according to time and distance of thrown
function CalculatePower(time : float, distance : float) { //returns the power in the range [0..1]
	//print("prueba = " + Mathf.InverseLerp(1, 10, 20));
	//time = Mathf.Clamp
	var inverseTime : float = 1.0 / time; // + Mathf.Abs(direction.z); //power is the inverse of time of throw + distance
	inverseTime = Mathf.InverseLerp(gesture_Throw.minInverseTime, gesture_Throw.maxInverseTime, inverseTime); //clamps and converts to [0..1]
	
	distance = Mathf.InverseLerp(gesture_Throw.minDistanceThrow, gesture_Throw.maxDistanceThrow, distance);
	
	return inverseTime * 0.7 + distance * 0.3; //return power with percents of priority
	//print("input power = " + power + " and direction.z = " + distance);
}

function Detector_Throw() { //detects the gesture of hand for throw: along the z axis. two main positions: 1) back 2) front
	var hand : ZigInputJoint;
	if (leftHanded)
		hand = leftHand;
	else
		hand = rightHand;
		
	var pos : Vector3 = hand.Position - waist.Position; //position of hand respect of waist
	
	switch(gesture_Throw.state) { //like a state-machine
	case 0: //was finished, start again
	
		if ((pos.z < 0) && (EnoughDistanceZ(pos, gesture_Throw.backDistanceToStart))) { //we need this distance to avoid noise and decide when start
			//print("TO 11111111111");
			gesture_Throw.backHandPosition = pos; //hand.Position;
			gesture_Throw.state++; //hand starts going back, although this position could be the final back
		}
		break;
		
	case 1: //hand continues going back. loop of state 1 saving the maximum value (deepest) until hand start to go at front
		
		if ((pos.z < 0) && (pos.z <= gesture_Throw.backHandPosition.z)) //current position is deepest, continue going back (z is negative) 
			gesture_Throw.backHandPosition = pos; //hand.Position;
		else if ((pos.z > gesture_Throw.backHandPosition.z) && (EnoughDistanceZ(pos, gesture_Throw.backHandPosition, gesture_Throw.deltaMove))) { //finish going back
			//print("TO 2222222222222222222");
			gesture_Throw.backTime = Time.time; //System.DateTime.Now.Second; //record time of deepest back position
			gesture_Throw.frontHandPosition = pos; //hand.Position;
			gesture_Throw.state++; //hand starts to going front
		}
			
		break;
		
	case 2: //hand is going front. loop of state 2 saving the frontest value until hand goes back again
		if (pos.z >= gesture_Throw.frontHandPosition.z)
			gesture_Throw.frontHandPosition = pos; //hand.Position; //continue loop
		else { //pos.z < frontHand
		
			if (EnoughDistanceZ(gesture_Throw.frontHandPosition, gesture_Throw.backHandPosition, gesture_Throw.minDistanceThrow)) {
				//print("TO 333333333333333333333333333333333333");
				gesture_Throw.frontTime = Time.time; //record time of front end position
				gesture_Throw.frontHandPosition = pos; //hand.Position;
				gesture_Throw.state++; //finish gesture
			}
			else
			if (EnoughDistanceZ(pos, gesture_Throw.frontHandPosition, gesture_Throw.deltaMove)) { //without noise, it's considered that is going back again
				//print("RETURRRRRRRNNNNN TO 0");
				//gesture_Throw.backHandPosition = Vector3.zero; //reinitialize deep position
				gesture_Throw.state = 0; //--; //go back to state 0
			}
		}
			
		break;
		
	case 3: //finish gesture: calculate final direction and power
		//print("backTime = " + gesture_Throw.backTime + ", frontTime = " + gesture_Throw.frontTime);
		var direction : Vector3 = gesture_Throw.frontHandPosition - gesture_Throw.backHandPosition;
		
		var power = CalculatePower(gesture_Throw.frontTime - gesture_Throw.backTime, direction.z); //in range [0..1]
		direction = Vector3(Mathf.Sign(direction.x), Mathf.Sign(direction.y), Mathf.Sign(direction.z));
		
		gameObject.GetComponent(KinectGesturesHandler).Handler_ThrowBall(direction, power);
		GestureDetected();
		gesture_Throw.state = 0;
		break;
		
	default: 
		gesture_Throw.state = 0; 
		break;
	}
}


//************ Detector try catch ball ****************************
function Detector_Catch() {
	//var separate = (rightHand.Position - leftHand.Position).magnitude; //distance between hands. XXX: maybe only one axis respect front of player
	//var separate = Vector3.Distance(rightHand.Position, leftHand.Position);
	var diff : Vector3 = rightHand.Position - leftHand.Position;
	//print("separate = " + separate + ", diff = " + diff);
	if ((diff.x >= gesture_Catch.minOffset) && (diff.x <= gesture_Catch.maxOffset) //is the range of sepation in x axis
			&& (diff.y <= gesture_Catch.lineOffset) && (diff.z <= gesture_Catch.lineOffset)) { //hands are aligned, no much differ of y and z axis
		SendMessage("Handler_CatchBall"); //TODO: maybe check distance from ball heree
		GestureDetected();
	}
}

//************** every frame **************************************
//first, we update the joints. second, check for gestures

function Update() { //update joints
	if (trackedUser != null)
		UpdateJoints();
}

function LateUpdate() { // check for gestures

	if (!busy) { //(!detected && trackedUser != null) {
		//Detector_RightHandRaise();
		Detector_LeftHandRaise();
		//Detector_Incline(); //TODO: error: with catch ball still moving!
		
		Detector_Throw();
		//Detector_Catch();
    }
}


/*function OnDrawGizmosSelected () { //in scene view for debugging: draw sphere of radius to catch ball. 
	Gizmos.color = Color.green;
	//Gizmos.DrawWireSphere(player.transform.position, gesture_Catch.minSeparate); 
	//Gizmos.DrawWireSphere(player.transform.position, gesture_Catch.maxSeparate); 
}*/


//maybe TODO: for use correctly gizmos: function ZigToUnity(position : Vector3): Vector3 