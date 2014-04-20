#pragma strict

//inspirated in HandRaiseDetector.cs

/*public class DetectorEventArgs : EventArgs
{
    public ZigJointId Joint { get; private set; }
    public DetectorEventArgs(ZigJointId joint)
    {
        Joint = joint;
    }
}*/

//note that this script must be in the same object that KinectGesturesHandler.cs
var angleThreshold : float = 30; // degrees
private var leftHandSteady : ZigSteadyDetector; //for each gesture will be a gameObject with the components: ZigMapJointToSession, ZigSteadyDetector.
private var rightHandSteady : ZigSteadyDetector; //TODO: maybe no need zigsteady variables, maybe quit
private var leftHandDetector : GameObject;
private var rightHandDetector : GameObject;
private var trackedUser : ZigTrackedUser;

//XXX: listeners like ZigPushDetector.cs or ZigSteadyDetector??

//public event EventHandler<DetectorEventArgs> HandRaise;
/*protected void OnHandRaise(ZigJointId joint) {
   if (null != HandRaise) {
        HandRaise.Invoke(this, new DetectorEventArgs(joint));
    }
	
   //Debug.Log("HandRaiseDetector_HandRaise yeah");
   //SendMessage("HandRaiseDetector_HandRaise", joint, SendMessageOptions.DontRequireReceiver); //to KinectGesturesHandler.cs
	//gameObject.SendMessage("Handler_HandRaise");
}*/

// Use this for initialization
function Awake () {
	//note that this not works here: rightHand = trackedUser.Skeleton[(int)ZigJointId.RightHand];
	//var Steady : Handles;
	//Steady.
	
    leftHandDetector = new GameObject("LeftHandDetector");
    leftHandDetector.transform.parent = gameObject.transform;
    var leftMap : ZigMapJointToSession = leftHandDetector.AddComponent(ZigMapJointToSession);
    leftMap.joint = ZigJointId.LeftHand;

    rightHandDetector = new GameObject("RightHandDetector");
    rightHandDetector.transform.parent = gameObject.transform;
    var rightMap : ZigMapJointToSession = rightHandDetector.AddComponent(ZigMapJointToSession);
    rightMap.joint = ZigJointId.RightHand;
	
	//slower but with a better methodology:
	leftHandSteady = leftHandDetector.AddComponent(ZigSteadyDetector); //TODO: steady is slow, maybe use ZigPushDetector or other
	rightHandSteady = rightHandDetector.AddComponent(ZigSteadyDetector);
	
	leftHandSteady.Steady += function(sender, e) { //leftHandSteady.Steady += delegate(sender : object,  e : EventArgs) //leftHandSteady.Steady.AddEventListener("click", function(e) {
    	var power = 20.0;
        var hand : ZigInputJoint = trackedUser.Skeleton[ZigJointId.LeftHand]; //XXX: maybe define hand and elbow outside to not calculate them every time
        var elbow : ZigInputJoint = trackedUser.Skeleton[ZigJointId.LeftElbow];
        if (IsHandRaise(hand.Position, elbow.Position)) {
			Debug.Log("Steady Hand Left Hand Rise");
            gameObject.SendMessage("Handler_Pass", power); //OnHandRaise(ZigJointId.LeftHand);
        }
    };
    
    rightHandSteady.Steady += function(sender, e) {
    	var power = 40.0;
        var hand : ZigInputJoint = trackedUser.Skeleton[ZigJointId.RightHand];
        var elbow : ZigInputJoint = trackedUser.Skeleton[ZigJointId.RightElbow];
        if (IsHandRaise(hand.Position, elbow.Position)) {
			//print("Steady Hand Right Hand Rise");
            gameObject.SendMessage("Handler_ThrowBall", power); //OnHandRaise(ZigJointId.RightHand);
        }
    };
}


function OnUserAttach(user: ZigTrackedUser) { //called from KinectEngageUsers. before was Zig_Attach
	print("GesturesDetector: Zig Attach");
    trackedUser = user;
    user.AddListener(leftHandDetector);
    user.AddListener(rightHandDetector);
}

/*void Zig_UpdateUser(ZigTrackedUser user) //call it evert frame
{
    trackedUser = user;
}*/

function OnUserDetach(user: ZigTrackedUser) { // before was Zig Detach
	print("GesturesDetector: Zig Detach");
    user.RemoveListener(leftHandDetector);
    user.RemoveListener(rightHandDetector);
    trackedUser = null;
}

function IsHandRaise(handPosition : Vector3, elbowPosition : Vector3) : boolean {
    var torso : ZigInputJoint = trackedUser.Skeleton[ZigJointId.Torso];
    var head : ZigInputJoint = trackedUser.Skeleton[ZigJointId.Head];

    var armDirection : Vector3 = (handPosition - elbowPosition).normalized;
    var torsoDirection : Vector3 = (head.Position - torso.Position).normalized;
    var angle : double = Mathf.Acos(Vector3.Dot(armDirection, torsoDirection)) * 180 / Mathf.PI;
    return (angle < angleThreshold);
}


/*bool IsHandRaise2(Vector3 handPosition, Vector3 elbowPosition) {
	return handPosition.y > elbowPosition.y;
}*/

/*void Update() { //faster but is'nt the habitual methodology in ZigFu. also this will be call several times for only a gesture
		ZigInputJoint hand = trackedUser.Skeleton[(int)ZigJointId.LeftHand];
        ZigInputJoint elbow = trackedUser.Skeleton[(int)ZigJointId.LeftElbow];
        if (IsHandRaise(hand.Position, elbow.Position)) {
			print("Update Hand Left Hand Rise");
            OnHandRaise(ZigJointId.LeftHand);
        }

        hand = trackedUser.Skeleton[(int)ZigJointId.RightHand];
        elbow = trackedUser.Skeleton[(int)ZigJointId.RightElbow];
        if (IsHandRaise(hand.Position, elbow.Position)) {
			print("Update Hand Right Hand Rise");
            OnHandRaise(ZigJointId.RightHand);
        } 

}*/

