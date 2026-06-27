import User from '../models/user.js';

export const updateHandles = async (req, res) => {
  const { cfHandle, lcHandle } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.cfHandle = cfHandle || user.cfHandle;
    user.lcHandle = lcHandle || user.lcHandle;
    await user.save();

    res.json({ user: { id: user._id, email: user.email, cfHandle: user.cfHandle, lcHandle: user.lcHandle } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update handles' });
  }
};

