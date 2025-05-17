"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAllPosts = async () => {
            try {
                setLoading(true);
                const response = await fetch("http://localhost:4242/posts");

                if (!response.ok) {
                    throw new Error("Impossible de charger les billets");
                }

                const data = await response.json();
                setPosts(data);
            } catch (error) {
                console.error("Erreur lors du chargement des billets:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllPosts();
    }, []);

    if (loading) {
        return (
            <div className="container">
                <h1>Chargement des billets...</h1>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Tous les billets</h1>

            {error && <div className="error-message">{error}</div>}

            {posts.length === 0 ? (
                <p className="no-posts">Aucun billet pour le moment.</p>
            ) : (
                <div className="posts-grid">
                    {posts.map((post) => (
                        <div key={post.id} className="post-card">
                            <h2 className="post-title">{post.title}</h2>
                            <div className="post-meta">
                                <span>
                                    Par{" "}
                                    <Link
                                        href={`/${post.author.login}`}
                                        className="author-link"
                                    >
                                        {post.author.login}
                                    </Link>
                                </span>
                                <span className="post-date">
                                    {new Date(
                                        post.createdAt
                                    ).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="post-excerpt">
                                {post.content.length > 150
                                    ? post.content.substring(0, 150) + "..."
                                    : post.content}
                            </p>

                            <Link
                                href={`/${post.author.login}/posts/${post.id}`}
                                className="read-more-link"
                            >
                                Lire la suite
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 30px;
                    color: #333;
                }

                .error-message {
                    color: #d32f2f;
                    background-color: #fde8e8;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }

                .no-posts {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }

                .posts-grid {
                    display: grid;
                    grid-template-columns: repeat(
                        auto-fill,
                        minmax(300px, 1fr)
                    );
                    gap: 20px;
                }

                .post-card {
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    color: #333;
                    background-color: #f9f9f9;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .post-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                .post-title {
                    margin-top: 0;
                    margin-bottom: 10px;
                    color: #333;
                }

                .post-meta {
                    display: flex;
                    justify-content: space-between;
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                }

                .author-link {
                    color: #4285f4;
                    text-decoration: none;
                }

                .author-link:hover {
                    text-decoration: underline;
                }

                .post-excerpt {
                    color: #444;
                    line-height: 1.5;
                    margin-bottom: 15px;
                }

                .read-more-link {
                    display: inline-block;
                    color: #4285f4;
                    text-decoration: none;
                    font-weight: bold;
                }

                .read-more-link:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
