"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditPostPage() {
    const [formData, setFormData] = useState({
        title: "",
        content: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const params = useParams();
    const router = useRouter();
    const { login, id } = params;

    useEffect(() => {
        // Vérifier si l'utilisateur connecté est autorisé
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.login !== login) {
                setError("Vous n'êtes pas autorisé à modifier ce billet");
                setLoading(false);
                return;
            }
            setIsAuthorized(true);

            // Charger les données du billet
            fetchPostData();
        } catch (error) {
            console.error("Erreur lors de la vérification du token:", error);
            router.push("/login");
        }
    }, [login, id, router]);

    const fetchPostData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:4242/${login}/posts/${id}`
            );

            if (!response.ok) {
                throw new Error("Impossible de charger le billet");
            }

            const data = await response.json();
            setFormData({
                title: data.post.title,
                content: data.post.content,
            });
        } catch (error) {
            setError(error.message);
            console.error("Erreur lors du chargement du billet:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `http://localhost:4242/${login}/posts/${id}`,
                {
                    method: "PUT",
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
                    data.error || "Erreur lors de la mise à jour du billet"
                );
            }

            // Rediriger vers la page de détail du billet
            router.push(`/${login}/posts/${id}`);
        } catch (error) {
            setError(error.message);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-post-container">
                <h1>Chargement du billet...</h1>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="edit-post-container">
                <h1>Modifier un billet</h1>
                {error && <div className="error-message">{error}</div>}
                <Link href={`/${login}/posts/${id}`} className="back-button">
                    Retour au billet
                </Link>
            </div>
        );
    }

    return (
        <div className="edit-post-container">
            <h1>Modifier le billet</h1>

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
                        rows="15"
                        required
                    />
                </div>

                <div className="form-actions">
                    <Link
                        href={`/${login}/posts/${id}`}
                        className="cancel-button"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="submit-button"
                    >
                        {saving
                            ? "Enregistrement..."
                            : "Enregistrer les modifications"}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .edit-post-container {
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
                    font-family: inherit;
                }

                textarea {
                    resize: vertical;
                    min-height: 200px;
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
