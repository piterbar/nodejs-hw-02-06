const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
});

const Contact = mongoose.model('Contact', contactSchema);

// CRUD 
const listContacts = async (userId) => {
  return await Contact.find({ owner: userId });
};

const getContactById = async (contactId, userId) => {
  return await Contact.findOne({ _id: contactId, owner: userId });
};

const addContact = async (body) => {
  return await Contact.create(body);
};

const removeContact = async (contactId, userId) => {
  return await Contact.findOneAndDelete({ _id: contactId, owner: userId });
};

const updateContact = async (contactId, userId, body) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    body,
    { new: true }
  );
};

const updateStatusContact = async (contactId, userId, body) => {
  return await Contact.findOneAndUpdate(
    { _id: contactId, owner: userId },
    body,
    { new: true }
  );
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
