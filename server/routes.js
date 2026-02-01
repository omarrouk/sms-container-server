const express = require("express");
const router = express.Router();
const Message = require("./models/Message");

// Redirect root to login page
router.get("/", (req, res) => {
  res.redirect("/login.html");
});

// POST /login - Authenticate user with email and password from environment variables
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    // Get credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Check if environment variables are set
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error(
        "ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables",
      );
      return res.status(500).json({
        ok: false,
        error: "server_configuration_error",
        message: "Server is not configured properly",
      });
    }

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "credentials_required",
        message: "Email and password are required",
      });
    }

    // Check credentials
    if (
      email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      return res.status(200).json({
        ok: true,
        message: "Login successful",
        user: {
          email: ADMIN_EMAIL,
        },
      });
    } else {
      return res.status(401).json({
        ok: false,
        error: "invalid_credentials",
        message: "Invalid email or password",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Internal server error",
    });
  }
});

// POST /upload-messages - accepts array of messages and stores them
router.post("/upload-messages", async (req, res) => {
  try {
    const { messages } = req.body;

    // Validation
    if (!messages) {
      return res.status(400).json({
        ok: false,
        error: "messages_required",
        message: "Messages array is required",
      });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_format",
        message: "Messages must be an array",
      });
    }

    if (messages.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "empty_array",
        message: "Messages array cannot be empty",
      });
    }

    // Validate message structure
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.phone || !msg.body || !msg.direction || !msg.timestamp) {
        return res.status(400).json({
          ok: false,
          error: "invalid_message_structure",
          message: `Message at index ${i} is missing required fields (phone, body, direction, timestamp)`,
        });
      }

      if (!["sent", "received"].includes(msg.direction)) {
        return res.status(400).json({
          ok: false,
          error: "invalid_direction",
          message: `Message at index ${i} has invalid direction. Must be 'sent' or 'received'`,
        });
      }
    }

    // Transform and insert messages
    const docs = messages.map((m) => ({
      phone: m.phone,
      name: m.name || null,
      body: m.body,
      direction: m.direction,
      timestamp: new Date(m.timestamp),
    }));

    const result = await Message.insertMany(docs, { ordered: false });

    return res.status(200).json({
      ok: true,
      message: "Messages uploaded successfully",
      count: result.length,
    });
  } catch (err) {
    // Handle duplicate key errors gracefully
    if (err.code === 11000) {
      return res.status(200).json({
        ok: true,
        message: "Messages processed (some duplicates skipped)",
        warning: "Some messages were already in the database",
      });
    }

    console.error("Upload error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to upload messages",
    });
  }
});

// GET /threads - return unique phone numbers with latest timestamp
router.get("/threads", async (req, res) => {
  try {
    const results = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$phone",
          name: { $first: "$name" },
          last: { $first: "$timestamp" },
          lastBody: { $first: "$body" },
        },
      },
      {
        $project: {
          phone: "$_id",
          name: 1,
          last: 1,
          lastBody: 1,
          _id: 0,
        },
      },
      { $sort: { last: -1 } },
    ]);

    return res.status(200).json(results);
  } catch (err) {
    console.error("Get threads error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to retrieve threads",
    });
  }
});

// GET /messages/:phone - return messages for phone sorted oldest->newest
router.get("/messages/:phone", async (req, res) => {
  try {
    const phone = req.params.phone;

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "phone_required",
        message: "Phone number is required",
      });
    }

    const messages = await Message.find({ phone })
      .sort({ timestamp: 1 })
      .lean();

    return res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to retrieve messages",
    });
  }
});

// GET /health - Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// PUT /messages/:id - Update a message
router.put("/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { body, name } = req.body;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "id_required",
        message: "Message ID is required",
      });
    }

    const updateData = {};
    if (body !== undefined) updateData.body = body;
    if (name !== undefined) updateData.name = name;

    const message = await Message.findByIdAndUpdate(id, updateData, { new: true });

    if (!message) {
      return res.status(404).json({
        ok: false,
        error: "not_found",
        message: "Message not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Message updated successfully",
      data: message,
    });
  } catch (err) {
    console.error("Update message error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to update message",
    });
  }
});

// DELETE /messages/:id - Delete a single message
router.delete("/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        error: "id_required",
        message: "Message ID is required",
      });
    }

    const message = await Message.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        ok: false,
        error: "not_found",
        message: "Message not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Message deleted successfully",
    });
  } catch (err) {
    console.error("Delete message error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to delete message",
    });
  }
});

// DELETE /threads/:phone - Delete all messages in a conversation
router.delete("/threads/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "phone_required",
        message: "Phone number is required",
      });
    }

    const result = await Message.deleteMany({ phone });

    return res.status(200).json({
      ok: true,
      message: "Conversation deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("Delete thread error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to delete conversation",
    });
  }
});

// POST /messages - Add a new message (for dashboard to send/add messages)
router.post("/messages", async (req, res) => {
  try {
    const { phone, name, body, direction } = req.body;

    // Validation
    if (!phone || !body || !direction) {
      return res.status(400).json({
        ok: false,
        error: "missing_fields",
        message: "Phone, body, and direction are required",
      });
    }

    if (!["sent", "received"].includes(direction)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_direction",
        message: "Direction must be 'sent' or 'received'",
      });
    }

    const message = new Message({
      phone,
      name: name || null,
      body,
      direction,
      timestamp: new Date(),
    });

    await message.save();

    return res.status(201).json({
      ok: true,
      message: "Message created successfully",
      data: message,
    });
  } catch (err) {
    console.error("Create message error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to create message",
    });
  }
});

// PUT /threads/:phone - Update contact name for a conversation
router.put("/threads/:phone", async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const { name } = req.body;

    if (!phone) {
      return res.status(400).json({
        ok: false,
        error: "phone_required",
        message: "Phone number is required",
      });
    }

    const result = await Message.updateMany({ phone }, { name: name || null });

    return res.status(200).json({
      ok: true,
      message: "Contact name updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Update thread error:", err);
    return res.status(500).json({
      ok: false,
      error: "server_error",
      message: "Failed to update contact name",
    });
  }
});

module.exports = router;
