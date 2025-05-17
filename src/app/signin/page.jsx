"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./style.css";

export default function SigninPage() {
    const [formData, setFormData] = useState({
        login: "",
        email: "",
        password: "",
        passwordConfirm: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const router = useRouter();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation côté client
        if (formData.password !== formData.passwordConfirm) {
            setError("Les mots de passe ne correspondent pas");
            setLoading(false);
            return;
        }

        if (formData.login.length < 5 || formData.login.length > 20) {
            setError("Le login doit contenir entre 5 et 20 caractères");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("http://localhost:4242/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue");
            }

            // Stocker le token dans localStorage
            localStorage.setItem("token", data.token);
            setMessage(data.message || "Inscription réussie !");
            if (data.login) {
                setTimeout(() => {
                    router.push("/".data.login);
                }, 500);
            }
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="signin-container">
            <h1>Inscription</h1>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="login">Nom d'utilisateur</label>
                    <input
                        type="text"
                        id="login"
                        name="login"
                        value={formData.login}
                        onChange={handleInputChange}
                        required
                        minLength="5"
                        maxLength="20"
                    />
                    <small>Entre 5 et 20 caractères</small>
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="passwordConfirm">
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="passwordConfirm"
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                >
                    {loading ? "Inscription en cours..." : "S'inscrire"}
                </button>
            </form>

            <div className="login-link">
                Déjà un compte ? <Link href="/login">Se connecter</Link>
            </div>
        </div>
    );
}
