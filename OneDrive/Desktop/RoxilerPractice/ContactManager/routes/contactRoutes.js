const express = require("express");
const router = express.Router();
const {
  getContact,
  createContact,
  getContactById,
  updateContactById,
  deleteContactById,
} = require("../controllers/contactController");

router.route("/").get(getContact).post(createContact);
router
  .route("/:id")
  .get(getContactById)
  .put(updateContactById)
  .delete(deleteContactById);

module.exports = router;
