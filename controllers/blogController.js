const BlogPost = require("../models/BlogPost");
const User = require("../models/User");
const Trip = require("../models/Trip");

// POST /api/blogs
exports.createBlogPost = async (req, res) => {
  try {
    const {
      tripId, // Optional
      title,
      summary,
      description,
      recommendations,
      advisory,
      coverPhoto,
      photos,
      contactInfo,
      tags,
      budget,
      concerns,
    } = req.body;

    if (tripId) {
      const trip = await Trip.findById(tripId);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
    }

    const blogPost = new BlogPost({
      trip: tripId || null,
      host: req.user.userId,
      title,
      summary,
      description,
      recommendations,
      advisory,
      coverPhoto,
      photos,
      contactInfo,
      tags,
      budget,
      concerns,
    });

    await blogPost.save();
    await User.findByIdAndUpdate(req.user.userId, {
      $push: { publicPosts: blogPost._id },
    });

    res.status(201).json(blogPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs
exports.getBlogPosts = async (req, res) => {
  try {
    const blogPosts = await BlogPost.find()
      .populate("trip")
      .populate("host", "name email")
      .populate("ratings.user", "name email");
    res.json(blogPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs/:id
exports.getBlogPostById = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id)
      .populate("trip")
      .populate("host", "name email")
      .populate("ratings.user", "name email");
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });
    res.json(blogPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/blogs/:id
exports.updateBlogPost = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });
    if (blogPost.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this blog post" });
    }
    const {
      title,
      summary,
      description,
      recommendations,
      advisory,
      coverPhoto,
      photos,
      contactInfo,
      tags,
      budget,
      concerns,
    } = req.body;
    if (title !== undefined) blogPost.title = title;
    if (summary !== undefined) blogPost.summary = summary;
    if (description !== undefined) blogPost.description = description;
    if (recommendations !== undefined)
      blogPost.recommendations = recommendations;
    if (advisory !== undefined) blogPost.advisory = advisory;
    if (coverPhoto !== undefined) blogPost.coverPhoto = coverPhoto;
    if (photos !== undefined) blogPost.photos = photos;
    if (contactInfo !== undefined) blogPost.contactInfo = contactInfo;
    if (tags !== undefined) blogPost.tags = tags;
    if (budget !== undefined) blogPost.budget = budget;
    if (concerns !== undefined) blogPost.concerns = concerns;

    await blogPost.save();
    res.json(blogPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/blogs/:id
exports.deleteBlogPost = async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.id);
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });
    if (blogPost.host.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this blog post" });
    }
    await blogPost.deleteOne();
    res.json({ message: "Blog post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/blogs/:id/rate
exports.rateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res
        .status(400)
        .json({ message: "Rating value must be between 1 and 5" });
    }
    const blogPost = await BlogPost.findById(blogId);
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });
    const existingRatingIndex = blogPost.ratings.findIndex(
      (rating) => rating.user.toString() === req.user.userId
    );
    if (existingRatingIndex !== -1) {
      blogPost.ratings[existingRatingIndex].value = value;
    } else {
      blogPost.ratings.push({ user: req.user.userId, value });
    }
    await blogPost.save();
    res.json({ message: "Rating submitted successfully", blogPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/blogs/:id/rate
exports.updateRating = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res
        .status(400)
        .json({ message: "Rating value must be between 1 and 5" });
    }
    const blogPost = await BlogPost.findById(blogId);
    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });
    const ratingIndex = blogPost.ratings.findIndex(
      (rating) => rating.user.toString() === req.user.userId
    );
    if (ratingIndex === -1) {
      return res
        .status(404)
        .json({ message: "Rating not found for update, use POST to create" });
    }
    blogPost.ratings[ratingIndex].value = value;
    await blogPost.save();
    res.json({ message: "Rating updated successfully", blogPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/blogs/search?query=...&tags=...
exports.searchBlogs = async (req, res) => {
  try {
    const { query, tags } = req.query;
    let matchCriteria = {};
    let orConditions = [];

    // Search in title, summary, description, recommendations, advisory
    if (query) {
      orConditions.push(
        { title: { $regex: query, $options: "i" } },
        { summary: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { recommendations: { $regex: query, $options: "i" } },
        { advisory: { $regex: query, $options: "i" } }
      );
    }

    // Filter by tags
    if (tags) {
      const tagsArray = tags.split(",").map((tag) => tag.trim());
      matchCriteria.tags = { $in: tagsArray };
    }

    if (orConditions.length > 0) {
      matchCriteria.$or = orConditions;
    }

    const blogs = await BlogPost.find(matchCriteria)
      .populate("trip")
      .populate("host", "name email")
      .populate("ratings.user", "name email");
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
