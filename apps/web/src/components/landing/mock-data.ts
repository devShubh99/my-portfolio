export const MOCK_DATA = {
    // Top marquee tickers
    tickers: [
        { name: "NIFTY 50", value: "24,320.15", change: 1.2, isUp: true },
        { name: "S&P 500", value: "5,891.20", change: 0.8, isUp: true },
        { name: "SENSEX", value: "80,124.60", change: 1.4, isUp: true },
        { name: "NASDAQ", value: "18,540.30", change: -0.3, isUp: false },
        { name: "Gold", value: "₹71,240", change: 0.5, isUp: true },
        { name: "USD/INR", value: "83.42", change: -0.1, isUp: false },
    ],
    // Statistics for the Social Proof bar
    stats: [
        { label: "Tickers Supported", value: "150+" },
        { label: "Asset Classes", value: "3" },
        { label: "Real-Time Prices", value: "via Yahoo Finance" },
    ],
    // Testimonials
    testimonials: [
        {
            quote: "Finally a tracker that handles both my US and Indian holdings in one place.",
            name: "Rahul M.",
            role: "Software Engineer",
            initial: "R",
        },
        {
            quote: "The AI insights caught a sector overexposure I completely missed.",
            name: "Priya S.",
            role: "Finance Analyst",
            initial: "P",
        },
    ],
    // Supported Market Badges
    brands: ["NSE", "BSE", "NYSE", "NASDAQ", "MCX", "FOREX"],
};
