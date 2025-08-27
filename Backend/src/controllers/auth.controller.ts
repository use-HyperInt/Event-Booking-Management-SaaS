import { Request, Response } from 'express';
import { auth } from '../config/firebase';
import User from '../models/userprof.model';
import { userRegistrationSchema } from '../validation/schema';

export const registerUser = async (req: Request, res: Response) => {
  try {
    console.log('Registration request body:', JSON.stringify(req.body, null, 2));
    
    const { error } = userRegistrationSchema.validate(req.body);
    if (error) {
      console.log('Validation error:', error.details[0].message);
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path,
        value: error.details[0].context?.value
      });
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // List of special phone numbers
    const specialPhoneNumbers = [
      '+918296170645', '+918945826432', '+918895059684', '+916392687570', '+917903002258',
      '+919066351526', '+918880454689', '+919895328152', '+917618759432', '+919632020025',
      '+919629867340', '+919952133341', '+919176316238', '+919591133288', '+919654446496',
      '+919871850787', '+919860001166', '+919535313224', '+918897424151', '+917338331933',
      '+919108456200', '+917349094838', '+919811105306', '+917019185389', '+919871829282',
      '+918309926020', '+919821107406', '+919619677028', '+919100109108', '+919148037082',
      '+917840826919', '+919574384080', '+917760285182', '+918906803005', '+919969566777',
      '+919975128738', '+918639103851', '+918197798914', '+919742814210', '+919079347072',
      '+918130055086', '+918208113475', '+919717819321', '+919111405488', '+918074401345',
      '+918780921824', '+919001089740', '+919566093459', '+917619351667', '+917044701621',
      '+919740563323', '+917760268424', '+918754597986', '+918667486534', '+918777486528',
      '+919986180922', '+917021561129', '+918668940985', '+919528908447', '+919833565439',
      '+919535580413', '+919751166222', '+918431836629', '+917006798233', '+919986628519',
      '+917348807757', '+917204719121', '+919972976042', '+918971027586', '+919119312696',
      '+919899168258', '+919597739751', '+917530028666', '+919655478084', '+917073065441',
      '+918861450234', '+917447014220', '+919870589030', '+917500236457', '+919672275295',
      '+918600295161', '+917023755912', '+917406896256', '+917676165779', '+919205847498',
      '+917483932879', '+918296904477', '+918293971012', '+917011458408', '+919586887820',
      '+919772828507', '+919033629119', '+917387924540', '+918197318251', '+918892282882',
      '+918920650263', '+918225031844', '+919987723454', '+917507191358', '+917306367596',
      '+918559924980', '+918317536394', '+919650039650', '+917439302713', '+917700907785',
      '+919956056679', '+919739747495', '+919936519250', '+919080513840', '+917809369569',
      '+919924125934', '+917976331944', '+919544922988', '+918789806764', '+918278615166',
      '+919007474178', '+916239643302', '+918359980335', '+919461635467', '+917976186965',
      '+919414248079', '+919425077480', '+917992323891', '+918171227905', '+917982112894',
      '+918299080245', '+919761205948', '+919898618548', '+917073329666', '+918700097919',
      '+919652068761', '+919636419554', '+919550528058', '+919154911840', '+919413069867',
      '+919521868459', '+919903355527', '+917976429191', '+918318477950', '+918128423748',
      '+916290479805', '+919479572165', '+917828503313', '+919591647399', '+919608184703',
      '+919855226836', '+916306448508', '+918288014878', '+917412886828', '+917829651496'
    ];

    // Check if the phone number is in the special list
    const isSpecialNumber = specialPhoneNumbers.includes(req.body.phoneNumber);
    
    const userData = {
      firebaseUid: decodedToken.uid,
      ...req.body,
      personalityTestCompleted: isSpecialNumber // Set to true if phone number is in special list
    };

    const user = new User(userData);
    console.log('Attempting to save user:', userData);
    
    if (isSpecialNumber) {
      console.log('Special phone number detected, marking personality test as completed');
    }

    try {
      const savedUser = await user.save();
      console.log('User saved successfully:', savedUser._id);
      console.log('Saved user data:', JSON.stringify(savedUser, null, 2));
    } catch (saveError) {
      console.error('Error saving user to database:', saveError);
      return res.status(500).json({ error: 'Failed to save user to database' });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        personalityTestCompleted: user.personalityTestCompleted
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const user = await User.findOne({ firebaseUid: decodedToken.uid })
      .populate('eventsBooked')
      .populate('pastEventsAttended');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        profileImage: user.profileImage,
        eventsBooked: user.eventsBooked,
        pastEventsAttended: user.pastEventsAttended,
        personalityTestCompleted: user.personalityTestCompleted
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check if user exists by phone number
export const checkUserExists = async (req: any, res: any) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const existingUser = await User.findOne({ phoneNumber });
    
    res.json({
      exists: !!existingUser,
      user: existingUser ? {
        id: existingUser._id,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phoneNumber: existingUser.phoneNumber,
        email: existingUser.email
      } : null
    });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
