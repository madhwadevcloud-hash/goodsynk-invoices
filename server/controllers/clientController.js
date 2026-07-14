const Client = require('../models/Client');

// @desc    Get all clients for logged-in user
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user._id }).sort({ name: 1 });
    res.json({ success: true, count: clients.length, clients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  try {
    const count = await Client.countDocuments({ user: req.user._id });
    if (count >= 3) {
      return res.status(403).json({ success: false, message: 'Client limit reached. Get a subscription to add more clients.' });
    }
    const client = await Client.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, client });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getClients, getClient, createClient, updateClient, deleteClient };
