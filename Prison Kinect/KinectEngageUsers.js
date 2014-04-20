#pragma strict

//inspirated in ZigEngageSplitScreen.cs

var nUsers = 2; //number of user: only 1 or 2
var player1 : GameObject; //players must be != null and have the component BallPlayer.js attached
var player2 : GameObject;

var nullPlayerPrefab : GameObject; //prefab of insible object with component BallPlayer.js attached
private var nullPlayer1 : GameObject; //invisible object. useful when player1 is undefined. player1 <- nullPlayer1
private var nullPlayer2 : GameObject;

var trackedUser1 : ZigTrackedUser; //{ get; private set; }
var trackedUser2 : ZigTrackedUser; //{ get; private set; }

var detectGestures = true;

private var gestures1 : GameObject; //gestures detector of each player
private var gestures2 : GameObject;


//boolean AllUsersEngaged { get { return null != trackedUser1 && null != trackedUser2; } }
function AllUsersEngaged() : boolean { 
	if (nUsers == 1)
		return null != trackedUser1;
	else //nUsers == 2
		return null != trackedUser1 && null != trackedUser2;
}


function Awake() {
	//creation of nullPlayers
	nullPlayer1 = Instantiate(nullPlayerPrefab) as GameObject; //don't worry about position and rotation, they are invisible
	nullPlayer1.transform.parent = transform;
	
	nullPlayer2 = Instantiate(nullPlayerPrefab) as GameObject; //XXX: check difference between casts
	nullPlayer2.transform.parent = transform;
	
	if (player1 == null)
		player1 = nullPlayer1;
	else
		player1.SendMessage("Disappear"); //objects starts without rendering
	
	if (player2 == null)
		player2 = nullPlayer2;
	else
		player2.SendMessage("Disappear"); //XXX: or SendMessage("Stop");
	
	if (detectGestures) {
		gestures1 = new GameObject("KinectGestures1");
		gestures1.AddComponent(KinectGesturesDetector);
		gestures1.AddComponent(KinectGesturesHandler);
		gestures1.SendMessage("SetPlayer", player1); //set gameObject in KinectGesturesHandler
		gestures1.transform.parent = transform;
		DisableDetectGestures(1);
		
		if (nUsers == 2) {
			gestures2 = new GameObject("KinectGestures2");
			gestures2.AddComponent(KinectGesturesDetector);
			gestures2.AddComponent(KinectGesturesHandler);
			gestures2.SendMessage("SetPlayer", player2);
			gestures2.transform.parent = transform;
			DisableDetectGestures(2);
		}
	}
	
	print("End of Awake Engage Users");
}
	
	
function SetNumberUsers(n : int) {
	if ((n == 1) && (nUsers == 2)) { //if we want to quit the second user: quit user and detector
		player2.SendMessage("Disappear"); //XXX, maybe null player
        trackedUser2 = null;
		
		if (detectGestures)
			Destroy(gestures2);
        print("User 2 disengaged");
	}
	else if ((n == 2) && (nUsers == 1) && (detectGestures)) { //if we want to add the second user: create detector	
		gestures2 = new GameObject("KinectGestures2");
		gestures2.AddComponent(KinectGesturesDetector);
		gestures2.AddComponent(KinectGesturesHandler);
		gestures2.SendMessage("SetPlayer", player2);
		gestures2.transform.parent = transform;
		DisableDetectGestures(2);
	}
	
	nUsers = n;			
}


function OnChangePlayer1(player : GameObject) { //change the listener gameobject of user
	print("OnChangePlayer1");
	var state : boolean; //current state of player: enabled or disabled
	if (trackedUser1 != null)
		state = true;
	else
		state = false;

	player.SendMessage("Appear"); //old object to lose control will be enabled
	
	if (state) {
		trackedUser1.RemoveListener(player1);
		trackedUser1.AddListener(player);
		player.SendMessage("Appear"); //new object to current state
	}
	else
		player.SendMessage("Disappear"); 
	
	gestures1.SendMessage("SetPlayer", player);
	player1 = player;
}

function OnChangePlayer2(player : GameObject) { //in this case it's guaranteed that nUsers == 2
	print("OnChangePlayer2");
	var state : boolean;
	if (trackedUser2 != null)
		state = true;
	else
		state = false;

	player.SendMessage("Appear");
	
	if (state) {
		trackedUser2.RemoveListener(player2);
		trackedUser2.AddListener(player);
		player.SendMessage("Appear");
	}
	else
		player.SendMessage("Disappear"); 
	
	gestures2.SendMessage("SetPlayer", player);	
	player2 = player;
}


function OnNullPlayer1() {
	OnChangePlayer1(nullPlayer1); //XXX: maybe block user, but be carefull to unblock after correctly
}

function OnNullPlayer2() {
	OnChangePlayer2(nullPlayer2);
}

function OnUser1Blocked() { //in the case of burn or revive a user, he will move to the new area without kinect control
	trackedUser1.RemoveListener(player1);
	if (detectGestures)
		DisableDetectGestures(1);
}

function OnUser1Unblocked() { //return the control of user
	trackedUser1.AddListener(player1);
	if (detectGestures)
		EnableDetectGestures(1);
}

function OnUser2Blocked() { //in this case it's guaranteed that nUsers == 2
	trackedUser2.RemoveListener(player2);
	if (detectGestures)
		DisableDetectGestures(2);
}

function OnUser2Unblocked() {
	trackedUser2.AddListener(player2);
	if (detectGestures)
		EnableDetectGestures(2);
}

/*function Zig_Update(ZigInput zig) {
	Zig_UserFound(user);
}*/


function Zig_UserFound(user : ZigTrackedUser) {
	var areTheyEngaged : boolean = AllUsersEngaged();
	
	if (null == trackedUser1) { //user 1
		player1.SendMessage("Appear");
		trackedUser1 = user;
        trackedUser1.AddListener(player1);
		
		if (detectGestures) {
			EnableDetectGestures(1);
			gestures1.SendMessage("OnUserAttach", user);
		}
        print("User 1 engaged"); //SendMessage("User1Engaged", this, SendMessageOptions.DontRequireReceiver);
    }
	else
	if ((null == trackedUser2) && (nUsers == 2)) { //user 2
		player2.SendMessage("Appear");
		trackedUser2 = user;
		trackedUser2.AddListener(player2);
		
		if (detectGestures) {
			EnableDetectGestures(2);
			gestures2.SendMessage("OnUserAttach", user);
		}
        print("User 2 engaged"); //SendMessage("User2Engaged", this, SendMessageOptions.DontRequireReceiver);
   }
	
    if (!areTheyEngaged && AllUsersEngaged()) {
        print("All Users Engaged"); //SendMessage("AllUsersEngaged", this, SendMessageOptions.DontRequireReceiver);
		//TODO: SendMessage to PrisonRules to continue game
    }
}

function Zig_UserLost(user : ZigTrackedUser) {
    if (user == trackedUser1) {
		player1.SendMessage("Disappear");
        trackedUser1 = null;
		
		if (detectGestures) {
			gestures1.SendMessage("OnUserDetach", user);
			DisableDetectGestures(1);
		}
        print("User 1 disengaged"); //SendMessage("User1Disengaged", this, SendMessageOptions.DontRequireReceiver);
        //TODO: prisonHUD.SendMessage("OnKinectUserLost", 1);
		//TODO: SendMessage to PrisonRules to stop the game
    }
    if (user == trackedUser2) { //don't need to check if (nUsers == 2)
		player2.SendMessage("Disappear");
        trackedUser2 = null;
		
		if (detectGestures) {
			gestures2.SendMessage("OnUserDetach", user);
			DisableDetectGestures(2);
		}
        print("User 2 disengaged");  //SendMessage("User2Disengaged", this, SendMessageOptions.DontRequireReceiver);
        
        /*if (nUsers == 2) {
        	//TODO: prisonHUD.SendMessage("OnKinectUserLost", 2);
        	//TODO: SendMessage to PrisonRules to stop the game
        }*/
    }
}


/* Disable detection of gestures in specified player.
   Note that we still need KinectGesturesHandler in case of OnChangePlayer, so gestures2.SetActive(false) don't works */
function DisableDetectGestures(player : int) { 
	var detector : KinectGesturesDetector;
	if (player == 2)
		detector = gestures2.GetComponent(KinectGesturesDetector) as KinectGesturesDetector;
	else
		detector = gestures1.GetComponent(KinectGesturesDetector) as KinectGesturesDetector;
		
	detector.CancelInvoke(); 
	detector.StopAllCoroutines();
	detector.enabled = false;
	//TODO: disable child detectors or gestures2.SetActive(false) like before
}

function EnableDetectGestures(player : int) { //enable detection of gestures in specified player
	if (player == 2)
		gestures2.GetComponent(KinectGesturesDetector).enabled = true;
	else
		gestures1.GetComponent(KinectGesturesDetector).enabled = true;
}


