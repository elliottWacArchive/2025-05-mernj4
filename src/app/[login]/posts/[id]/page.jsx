"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PostDetailPage() {
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [commentLoading, setCommentLoading] = useState(false);
    const params = useParams();
    const router = useRouter();
    const { login, id } = params;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setIsOwner(payload.login === login);
                setCurrentUserId(payload.id);
            } catch (error) {
                console.error(
                    "Erreur lors de la vérification du token:",
                    error
                );
            }
        }

        fetchPostDetails();
    }, [login, id]);

    const fetchPostDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:4242/${login}/posts/${id}`
            );

            if (!response.ok) {
                throw new Error("Impossible de charger le billet");
            }

            const data = await response.json();
            setPost(data.post);
            setComments(data.comments);
        } catch (error) {
            setError(error.message);
            console.error("Erreur lors du chargement du billet:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setCommentLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                router.push("/login");
                return;
            }

            const response = await fetch(
                `http://localhost:4242/${login}/posts/${id}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: newComment }),
                }
            );

            if (!response.ok) {
                throw new Error("Impossible d'ajouter le commentaire");
            }

            fetchPostDetails();
            setNewComment("");
        } catch (error) {
            setError(error.message);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:4242/${login}/posts/${id}/comments/${commentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Impossible de supprimer le commentaire");
            }
            fetchPostDetails();
        } catch (error) {
            setError(error.message);
        }
    };

    if (loading) {
        return (
            <div className="post-container">
                <h1>Chargement du billet...</h1>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-container">
                <h1>Billet non trouvé</h1>
                {error && <div className="error-message">{error}</div>}
                <Link href={`/${login}`} className="back-button">
                    Retour au blog
                </Link>
            </div>
        );
    }

    return (
        <div className="post-container">
            <Link href={`/${login}`} className="back-button">
                ← Retour au blog
            </Link>

            {error && <div className="error-message">{error}</div>}

            <article className="post-content">
                <h1>{post.title}</h1>
                <div className="post-metadata">
                    <p className="post-date">
                        Publié le{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                        {post.updatedAt !== post.createdAt &&
                            ` (Modifié le ${new Date(
                                post.updatedAt
                            ).toLocaleDateString()})`}
                    </p>
                </div>

                <div className="post-body">
                    {post.content.split("\n").map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                    ))}
                </div>

                {isOwner && (
                    <div className="post-actions">
                        <Link
                            href={`/${login}/posts/${id}/edit`}
                            className="edit-button"
                        >
                            Modifier ce billet
                        </Link>
                    </div>
                )}
            </article>

            <section className="comments-section">
                <h2>Commentaires ({comments.length})</h2>

                {localStorage.getItem("token") ? (
                    <form onSubmit={handleAddComment} className="comment-form">
                        <textarea
                            placeholder="Ajouter un commentaire..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={commentLoading || !newComment.trim()}
                            className="submit-button"
                        >
                            {commentLoading ? "Envoi..." : "Commenter"}
                        </button>
                    </form>
                ) : (
                    <p className="login-prompt">
                        <Link href="/login">Connectez-vous</Link> pour ajouter
                        un commentaire.
                    </p>
                )}

                {comments.length === 0 ? (
                    <p className="no-comments">
                        Aucun commentaire pour le moment.
                    </p>
                ) : (
                    <div className="comments-list">
                        {comments.map((comment) => (
                            <div key={comment.id} className="comment">
                                <div className="comment-header">
                                    <strong className="comment-author">
                                        {comment.authorId.login ||
                                            "Utilisateur"}
                                    </strong>
                                    <span className="comment-date">
                                        {new Date(
                                            comment.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="comment-content">
                                    {comment.content}
                                </p>

                                {(isOwner ||
                                    currentUserId === comment.authorId.id) && (
                                    <button
                                        onClick={() =>
                                            handleDeleteComment(comment.id)
                                        }
                                        className="delete-comment-button"
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style jsx>{`
                .post-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .back-button {
                    display: inline-block;
                    margin-bottom: 20px;
                    color: #4285f4;
                    text-decoration: none;
                }

                .back-button:hover {
                    text-decoration: underline;
                }

                .error-message {
                    color: #d32f2f;
                    background-color: #fde8e8;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }

                .post-content {
                    margin-bottom: 40px;
                    background-color: #f9f9f9;
                    padding: 20px;
                    color: black;
                    border-radius: 5px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                h1 {
                    margin-top: 0;
                    color: #333;
                }

                .post-metadata {
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }

                .post-body {
                    line-height: 1.6;
                }

                .post-actions {
                    margin-top: 20px;
                    text-align: right;
                }

                .edit-button {
                    display: inline-block;
                    padding: 8px 15px;
                    background-color: #0f9d58;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                }

                .edit-button:hover {
                    background-color: #0b8043;
                }

                .comments-section {
                    margin-top: 30px;
                }

                .comments-section h2 {
                    border-bottom: 1px solid #eee;
                    padding-bottom: 10px;
                }

                .comment-form {
                    margin-bottom: 20px;
                }

                textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    min-height: 100px;
                    margin-bottom: 10px;
                    font-family: inherit;
                    resize: vertical;
                }

                .submit-button {
                    padding: 8px 15px;
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }

                .submit-button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }

                .login-prompt {
                    margin: 20px 0;
                    text-align: center;
                }

                .login-prompt a {
                    color: #4285f4;
                    text-decoration: none;
                }

                .login-prompt a:hover {
                    text-decoration: underline;
                }

                .no-comments {
                    color: #666;
                    text-align: center;
                    margin: 20px 0;
                }

                .comments-list {
                    margin-top: 20px;
                }

                .comment {
                    border-bottom: 1px solid #eee;
                    padding: 15px 0;
                    position: relative;
                }

                .comment:last-child {
                    border-bottom: none;
                }

                .comment-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                .comment-author {
                    color: #333;
                }

                .comment-date {
                    color: #666;
                    font-size: 12px;
                }

                .comment-content {
                    margin: 0;
                    line-height: 1.5;
                }

                .delete-comment-button {
                    background-color: transparent;
                    color: #db4437;
                    border: none;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 0;
                    margin-top: 10px;
                    text-decoration: underline;
                }

                .delete-comment-button:hover {
                    color: #c53929;
                }
            `}</style>
        </div>
    );
}
