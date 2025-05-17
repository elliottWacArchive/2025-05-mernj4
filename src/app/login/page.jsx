"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./style.css";

export default function LoginPage() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
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

        try {
            const response = await fetch("http://localhost:4242/login", {
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

            localStorage.setItem("token", data.token);

            setMessage(data.message);
            setLoading(false);

            setTimeout(() => {
                router.push(`/${data.login}`);
            }, 1500);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h1>Connexion</h1>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
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

                <button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                >
                    {loading ? "Connexion en cours..." : "Se connecter"}
                </button>
            </form>

            <div className="register-link">
                Pas encore de compte ? <Link href="/signin">S'inscrire</Link>
            </div>
        </div>
    );
}
