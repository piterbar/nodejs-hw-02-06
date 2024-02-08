const express = require('express');
const Joi = require('joi');
const router = express.Router();
const contactsOperations = require('../../models/contacts');

// Joi schema
const contactSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(15).required(),
});

router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactsOperations.listContacts();
    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

router.get('/:contactId', async (req, res, next) => {
  try {
    const contact = await contactsOperations.getContactById(req.params.contactId);
    if (contact) {
      res.json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const newContact = await contactsOperations.addContact(req.body);
    res.status(201).json(newContact);
  } catch (err) {
    next(err);
  }
});

router.delete('/:contactId', async (req, res, next) => {
  try {
    const removedContact = await contactsOperations.removeContact(req.params.contactId);
    if (removedContact) {
      res.json({ message: 'Contact deleted' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});

router.put('/:contactId', async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    const updatedContact = await contactsOperations.updateContact(req.params.contactId, req.body);
    if (updatedContact) {
      res.json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
