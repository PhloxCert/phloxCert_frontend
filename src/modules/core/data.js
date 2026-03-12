export const currentUser = {
    name: "Alessandro Rossi",
    role: "Safety Manager",
    email: "manager@iota-safety.com"
};

export const documents = [
    {
        id: 1,
        name: "Registro_Antincendio_2026.pdf",
        uploadDate: "2026-02-15",
        expirationDate: "2026-10-12",
        hash: "0x7f82b91c...fca2",
        type: "Fire Safety Log"
    },
    {
        id: 2,
        name: "Certificato_Prevenzione_Incendi.pdf",
        uploadDate: "2025-05-20",
        expirationDate: "2026-05-20", // Expiring soon
        hash: "0x3a91c82d...e1b9",
        type: "CPI Certificate"
    },
    {
        id: 3,
        name: "Manutenzione_Estintori_Q4_2025.pdf",
        uploadDate: "2025-12-10",
        expirationDate: "2026-01-10", // Expired
        hash: "0x8b2d1f9a...c3d4",
        type: "Maintenance Report"
    }
];

export const getStatus = (expirationDateStr) => {
    const today = new Date();
    const expDate = new Date(expirationDateStr);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { label: "Expired", color: "red", icon: "alert-circle" };
    } else if (diffDays < 90) { // Less than 3 months
        return { label: "Expiring Soon", color: "yellow", icon: "alert-triangle" };
    } else {
        return { label: "Valid", color: "green", icon: "check-circle" };
    }
};
