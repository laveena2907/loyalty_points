const TIER_RULES = {
    SILVER: {
        rate: 0.10
    },

    GOLD: {
        rate: 0.15
    },

    PLATINUM: {
        rate: 0.30
    }
};

const calculateTier = (lifetimePoints) => {
    if (lifetimePoints >= 5000) {
        return "PLATINUM";
    }

    if (lifetimePoints >= 500) {
        return "GOLD";
    }

    return "SILVER";
};

const calculatePoints = (amount, tier) => {
    const rate = TIER_RULES[tier]?.rate ?? 0.10;

    return Math.floor(amount * rate);
};

module.exports = {
    TIER_RULES,
    calculateTier,
    calculatePoints
};