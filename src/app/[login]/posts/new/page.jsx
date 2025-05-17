"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function CreatePostPage() {
    const [formData, setFormData] = useState({
        title: "",
        content: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const params = useParams();
    const router = useRouter();
    const { login } = params;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.login !== login) {
                setError(
                    "Vous n'êtes pas autorisé à créer un billet sur ce blog"
                );
                return;
            }
            setIsAuthorized(true);
        } catch (error) {
            console.error("Erreur lors de la vérification du token:", error);
            router.push("/login");
        }
    }, [login, router]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:4242/${login}/posts`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Erreur lors de la création du billet"
                );
            }

            // Rediriger vers le blog
            router.push(`/${login}`);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="create-post-container">
                <h1>Créer un nouveau billet</h1>
                {error && <div className="error-message">{error}</div>}
                <Link href={`/${login}`} className="back-button">
                    Retour au blog
                </Link>
            </div>
        );
    }

    return (
        <div className="create-post-container">
            <h1>Créer un nouveau billet</h1>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Titre</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Contenu</label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows="10"
                        required
                    />
                </div>

                <div className="form-actions">
                    <Link href={`/${login}`} className="cancel-button">
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="submit-button"
                    >
                        {loading ? "Création en cours..." : "Publier le billet"}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .create-post-container {
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

                .form-group {
                    margin-bottom: 20px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }

                input,
                textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 16px;
                }

                textarea {
                    resize: vertical;
                }

                .form-actions {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                }

                .submit-button,
                .cancel-button,
                .back-button {
                    padding: 10px 15px;
                    border-radius: 4px;
                    font-size: 16px;
                    text-decoration: none;
                    text-align: center;
                }

                .submit-button {
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .submit-button:hover {
                    background-color: #3367d6;
                }

                .submit-button:disabled {
                    background-color: #cccccc;
                    cursor: not-allowed;
                }

                .cancel-button,
                .back-button {
                    background-color: #f1f1f1;
                    color: #333;
                    border: 1px solid #ddd;
                }

                .cancel-button:hover,
                .back-button:hover {
                    background-color: #e4e4e4;
                }
            `}</style>
        </div>
    );
}
