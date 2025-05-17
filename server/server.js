const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const cors = require("cors");
const app = express();
const port = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(
    cors({
        origin: "http://localhost:3000", // Remplacez par l'URL de votre frontend React
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use((req, res, next) => {
    console.log("Route appelée:", req.path);
    console.log("Body reçu:", req.body);
    console.log("content-type:", req.headers["content-type"]);
    next();
});

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            login: user.login,
            email: user.email,
            type: user.type,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
}

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("mongodb connecté");
    })
    .catch((err) => {
        console.error("erreur mongodb:", err);
    });

const userSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        default: function () {
            return Math.floor(Date.now() / 1000);
        },
    },
    login: {
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 20,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: Boolean,
        default: false,
    },
});

const postSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        default: function () {
            return Math.floor(Date.now() / 1000);
        },
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    authorId: {
        type: Number,
        required: true,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const commentSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
        default: function () {
            return Math.floor(Date.now() / 1000);
        },
    },
    content: {
        type: String,
        required: true,
    },
    authorId: {
        type: Number,
        required: true,
        ref: "User",
    },
    postId: {
        type: Number,
        required: true,
        ref: "Post",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Post = mongoose.model("Post", postSchema);
const Comment = mongoose.model("Comment", commentSchema);
const User = mongoose.model("User", userSchema);

function hashPassword(password) {
    return crypto.createHash("sha1").update(password).digest("hex");
}

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Authentification requise" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findOne({ id: decoded.id });
        if (!user) {
            return res
                .status(401)
                .json({ error: "Utilisateur non trouvé pour l'auth" });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Token invalide" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expiré" });
        }
        console.error("Erreur auth:", error);
        res.status(500).json({ error: "Erreur auth" });
    }
};

app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        const postsWithAuthors = await Promise.all(
            posts.map(async (post) => {
                const author = await User.findOne({ id: post.authorId });
                if (!author) {
                    return {
                        ...post.toObject(),
                        author: { login: "Utilisateur inconnu" },
                    };
                }
                return {
                    ...post.toObject(),
                    author: {
                        id: author.id,
                        login: author.login,
                    },
                };
            })
        );

        res.status(200).json(postsWithAuthors);
    } catch (error) {
        console.error(
            "Erreur lors de la récupération de tous les billets:",
            error
        );
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { login, email, password, passwordConfirm } = req.body;

        if (!login || !email || !password || !passwordConfirm) {
            return res
                .status(400)
                .json({ error: "Tous les champs sont requis" });
        }

        if (login.length < 5 || login.length > 20) {
            return res.status(400).json({
                error: "Le login doit contenir entre 5 et 20 caractères",
            });
        }

        if (password !== passwordConfirm) {
            return res
                .status(400)
                .json({ error: "Les mots de passe ne correspondent pas" });
        }

        const existingUser = await User.findOne({
            $or: [{ login }, { email }],
        });
        if (existingUser) {
            if (existingUser.login === login) {
                return res
                    .status(400)
                    .json({ error: "Ce login est déjà utilisé" });
            }
            return res
                .status(400)
                .json({ error: "Cet email est déjà utilisé" });
        }

        const hashedPassword = hashPassword(password);
        const newUser = new User({
            login,
            email,
            password: hashedPassword,
            type: false,
        });

        await newUser.save();
        const token = generateToken(newUser);

        res.status(200).json({
            message: `Welcome ${login} !`,
            token: token,
        });
    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(400).json({
            error: "Une erreur est survenue lors de l'inscription",
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ error: "Email et mot de passe requis" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res
                .status(400)
                .json({ error: "Email ou mot de passe incorrect" });
        }

        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res
                .status(400)
                .json({ error: "Email ou mot de passe incorrect" });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: `Welcome ${user.login} !`,
            token: token,
            login: user.login,
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(400).json({
            error: "Erreur connexion",
        });
    }
});

app.get("/:login", async (req, res) => {
    try {
        const userLogin = req.params.login;
        const user = await User.findOne({ login: userLogin });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        const posts = await Post.find({ authorId: user.id }).sort({
            createdAt: -1,
        });

        res.status(200).json(posts);
    } catch (error) {
        console.error("Erreur lors de la récupération des billets:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post("/:login/posts", authenticateUser, async (req, res) => {
    try {
        const userLogin = req.params.login;
        const { title, content } = req.body;

        if (req.user.login !== userLogin) {
            return res.status(403).json({
                error: "Vous n'êtes pas autorisé à publier sur ce blog",
            });
        }

        if (!title || !content) {
            return res
                .status(400)
                .json({ error: "Le titre et le contenu sont requis" });
        }

        const newPost = new Post({
            title,
            content,
            authorId: req.user.id,
        });

        await newPost.save();

        res.status(201).json({
            message: "Billet créé avec succès",
            post: newPost,
        });
    } catch (error) {
        console.error("Erreur lors de la création du billet:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.get("/:login/posts/:postId", async (req, res) => {
    try {
        const userLogin = req.params.login;
        const postId = parseInt(req.params.postId);

        const user = await User.findOne({ login: userLogin });
        if (!user) {
            return res.status(404).json({
                error: "Utilisateur non trouvé pour le chargement d'un post",
            });
        }

        const post = await Post.findOne({ id: postId, authorId: user.id });
        if (!post) {
            return res.status(404).json({ error: "Billet non trouvé" });
        }

        const comments = await Comment.find({ postId: post.id })
            .populate({
                path: "authorId",
                select: "id login",
                model: User,
                localField: "authorId",
                foreignField: "id",
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ post, comments });
    } catch (error) {
        console.error("Erreur lors de la récupération du billet:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.put("/:login/posts/:postId", authenticateUser, async (req, res) => {
    try {
        const userLogin = req.params.login;
        const postId = parseInt(req.params.postId);
        const { title, content } = req.body;

        if (req.user.login !== userLogin) {
            return res
                .status(403)
                .json({ error: "Vous n'êtes pas autorisé à modifier ce blog" });
        }

        if (!title || !content) {
            return res
                .status(400)
                .json({ error: "Le titre et le contenu sont requis" });
        }

        const post = await Post.findOne({ id: postId, authorId: req.user.id });
        if (!post) {
            return res.status(404).json({ error: "Billet non trouvé" });
        }

        post.title = title;
        post.content = content;
        post.updatedAt = Date.now();

        await post.save();

        res.status(200).json({
            message: "Billet mis à jour avec succès",
            post,
        });
    } catch (error) {
        console.error("Erreur lors de la mise à jour du billet:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.delete("/:login/posts/:postId", authenticateUser, async (req, res) => {
    try {
        const userLogin = req.params.login;
        const postId = parseInt(req.params.postId);

        if (req.user.login !== userLogin) {
            return res.status(403).json({
                error: "Vous n'êtes pas autorisé à supprimer sur ce blog",
            });
        }

        const post = await Post.findOne({ id: postId, authorId: req.user.id });
        if (!post) {
            return res.status(404).json({ error: "Billet non trouvé" });
        }

        await Comment.deleteMany({ postId });

        await Post.deleteOne({ id: postId });

        res.status(200).json({
            message: "Billet et commentaires associés supprimés avec succès",
        });
    } catch (error) {
        console.error("Erreur lors de la suppression du billet:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.post(
    "/:login/posts/:postId/comments",
    authenticateUser,
    async (req, res) => {
        try {
            const userLogin = req.params.login;
            const postId = parseInt(req.params.postId);
            const { content } = req.body;

            if (!content) {
                return res
                    .status(400)
                    .json({ error: "Le contenu du commentaire est requis" });
            }

            const user = await User.findOne({ login: userLogin });
            if (!user) {
                return res.status(404).json({
                    error: "Utilisateur non trouvé pour l'ajout d'un com",
                });
            }

            const post = await Post.findOne({ id: postId, authorId: user.id });
            if (!post) {
                return res.status(404).json({ error: "Billet non trouvé" });
            }

            const newComment = new Comment({
                content,
                authorId: req.user.id,
                postId,
            });

            await newComment.save();

            res.status(201).json({
                message: "Commentaire ajouté avec succès",
                comment: newComment,
            });
        } catch (error) {
            console.error("Erreur lors de l'ajout du commentaire:", error);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
);

app.delete(
    "/:login/posts/:postId/comments/:commentId",
    authenticateUser,
    async (req, res) => {
        try {
            const userLogin = req.params.login;
            const postId = parseInt(req.params.postId);
            const commentId = parseInt(req.params.commentId);

            const user = await User.findOne({ login: userLogin });
            if (!user) {
                return res.status(404).json({
                    error: "Utilisateur non trouvé pour la suppression d'un post",
                });
            }

            const post = await Post.findOne({ id: postId, authorId: user.id });
            const comment = await Comment.findOne({ id: commentId, postId });

            if (!post) {
                return res.status(404).json({ error: "Billet non trouvé" });
            }

            if (!comment) {
                return res
                    .status(404)
                    .json({ error: "Commentaire non trouvé" });
            }

            if (
                post.authorId !== req.user.id &&
                comment.authorId !== req.user.id
            ) {
                return res.status(403).json({
                    error: "Vous n'êtes pas autorisé à supprimer ce commentaire",
                });
            }

            await Comment.deleteOne({ id: commentId });

            res.status(200).json({
                message: "Commentaire supprimé avec succès",
            });
        } catch (error) {
            console.error(
                "Erreur lors de la suppression du commentaire:",
                error
            );
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
);

app.listen(port, () => {
    console.log(`express connecté`);
});
