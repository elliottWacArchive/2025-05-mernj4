"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function BlogPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const params = useParams();
    const router = useRouter();
    const { login } = params;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setIsOwner(payload.login === login);
            } catch (error) {
                console.error(
                    "Erreur lors de la vérification du token:",
                    error
                );
            }
        }

        fetchPosts();
    }, [login]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:4242/${login}`);

            if (!response.ok) {
                throw new Error("Impossible de charger les billets");
            }

            const data = await response.json();
            setPosts(data);
        } catch (error) {
            setError(error.message);
            console.error("Erreur lors du chargement des billets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce billet ?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:4242/${login}/posts/${postId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Impossible de supprimer le billet");
            }

            fetchPosts();
        } catch (error) {
            setError(error.message);
            console.error("Erreur lors de la suppression du billet:", error);
        }
    };

    if (loading) {
        return (
            <div className="blog-container">
                <h1>Blog de {login}</h1>
                <p>Chargement des billets...</p>
            </div>
        );
    }

    return (
        <div className="blog-container">
            <h1>Blog de {login}</h1>

            {error && <div className="error-message">{error}</div>}

            {isOwner && (
                <div className="blog-actions">
                    <Link
                        href={`/${login}/posts/new`}
                        className="create-post-button"
                    >
                        Créer un nouveau billet
                    </Link>
                </div>
            )}

            {posts.length === 0 ? (
                <p>Aucun billet pour le moment.</p>
            ) : (
                <div className="posts-list">
                    {posts.map((post) => (
                        <div key={post.id} className="post-card">
                            <h2 className="post-title">{post.title}</h2>
                            <p className="post-date">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                            <div className="post-actions">
                                <Link
                                    href={`/${login}/posts/${post.id}`}
                                    className="view-post-button"
                                >
                                    Voir le billet
                                </Link>

                                {isOwner && (
                                    <>
                                        <Link
                                            href={`/${login}/posts/${post.id}/edit`}
                                            className="edit-post-button"
                                        >
                                            Modifier
                                        </Link>
                                        <button
                                            onClick={() =>
                                                handleDeletePost(post.id)
                                            }
                                            className="delete-post-button"
                                        >
                                            Supprimer
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .blog-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .error-message {
                    color: #d32f2f;
                    background-color: #fde8e8;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }

                .blog-actions {
                    margin-bottom: 30px;
                    text-align: right;
                }

                .create-post-button {
                    display: inline-block;
                    padding: 10px 15px;
                    background-color: #4285f4;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    transition: background-color 0.3s;
                }

                .create-post-button:hover {
                    background-color: #3367d6;
                }

                .posts-list {
                    display: grid;
                    gap: 20px;
                }

                .post-card {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                    color: #333;
                }

                .post-title {
                    margin-top: 0;
                    color: #333;
                }

                .post-date {
                    color: #666;
                    font-size: 14px;
                }

                .post-actions {
                    margin-top: 15px;
                    display: flex;
                    gap: 10px;
                }

                .view-post-button,
                .edit-post-button {
                    padding: 5px 10px;
                    text-decoration: none;
                    color: white;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .view-post-button {
                    background-color: #4285f4;
                }

                .edit-post-button {
                    background-color: #0f9d58;
                }

                .delete-post-button {
                    padding: 5px 10px;
                    background-color: #db4437;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }

                .view-post-button:hover {
                    background-color: #3367d6;
                }

                .edit-post-button:hover {
                    background-color: #0b8043;
                }

                .delete-post-button:hover {
                    background-color: #c53929;
                }
            `}</style>
        </div>
    );
}
