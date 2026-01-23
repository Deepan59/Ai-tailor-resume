import { useState } from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';
import { payment } from '../services/api';
import Button from '../components/Button';
import './Payment.css';

export default function Payment() {
    const [loading, setLoading] = useState(false);

    const handlePayment = async (planId) => {
        setLoading(true);
        try {
            // 1. Create Order
            const order = await payment.createOrder(planId);

            // 2. Open Razorpay (Mocking frontend handling for now if script not loaded,
            // but assuming window.Razorpay exists or we simulate)
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY,
                amount: order.amount,
                currency: order.currency,
                name: "AI Resume Tailor",
                description: `Payment for ${planId}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        await payment.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Payment Successful!');
                        window.location.href = '/dashboard';
                    } catch (err) {
                        alert('Payment verification failed');
                        console.error(err);
                    }
                },
                prefill: {
                    name: "User Name", // Should come from context
                    email: "user@example.com"
                },
                theme: {
                    color: "#2563eb"
                }
            };

            if (window.Razorpay) {
                const rzp1 = new window.Razorpay(options);
                rzp1.open();
            } else {
                // Fallback / Mock for development without script
                console.log("Razorpay SDK not loaded. Mocking success for dev.");
                // alert('Razorpay SDK not loaded. Check console.');
                const mockResponse = {
                    razorpay_order_id: order.id,
                    razorpay_payment_id: "pay_mock_123",
                    razorpay_signature: "mock_sig"
                };
                await payment.verify(mockResponse);
                alert('Payment Successful (Mock)!');
                window.location.href = '/dashboard';
            }

        } catch (err) {
            console.error('Payment failed:', err);
            alert('Failed to initiate payment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container payment-container">
            <div className="payment-header">
                <h1 className="page-title">Upgrade Your Plan</h1>
                <p className="payment-subtitle">Unlock more tailored resumes and premium features.</p>
            </div>

            <div className="pricing-grid">
                {/* Free Plan */}
                <div className="pricing-card">
                    <div className="plan-header">
                        <h3>Free</h3>
                        <p className="price">₹0</p>
                    </div>
                    <ul className="pricing-features">
                        <li><CheckCircle size={16} /> 1 Tailored Resume</li>
                        <li><CheckCircle size={16} /> Basic Formatting</li>
                        <li><CheckCircle size={16} /> Standard Support</li>
                    </ul>
                    <Button variant="outline" className="width-full" disabled>Current Plan</Button>
                </div>

                {/* One-Time Plan */}
                <div className="pricing-card featured">
                    <div className="popular-tag">Most Popular</div>
                    <div className="plan-header">
                        <h3>One-Time Pack</h3>
                        <p className="price">₹299</p>
                    </div>
                    <ul className="pricing-features">
                        <li><CheckCircle size={16} /> 5 Tailored Resumes</li>
                        <li><CheckCircle size={16} /> Advanced AI Tailoring</li>
                        <li><CheckCircle size={16} /> Keyword Optimization</li>
                        <li><CheckCircle size={16} /> Priority Support</li>
                    </ul>
                    <Button
                        className="width-full"
                        onClick={() => handlePayment('One-Time Pack')}
                    >
                        Buy Now
                    </Button>
                </div>

                {/* Pro Plan */}
                <div className="pricing-card">
                    <div className="plan-header">
                        <h3>Pro Monthly</h3>
                        <p className="price">₹999<span>/mo</span></p>
                    </div>
                    <ul className="pricing-features">
                        <li><CheckCircle size={16} /> Unlimited Resumes</li>
                        <li><CheckCircle size={16} /> All Features Unlocked</li>
                        <li><CheckCircle size={16} /> Cover Letter Generator</li>
                        <li><CheckCircle size={16} /> LinkedIn Optimization</li>
                    </ul>
                    <Button
                        variant="outline"
                        className="width-full"
                        onClick={() => handlePayment('Pro Monthly')}
                    >
                        Subscribe
                    </Button>
                </div>
            </div>

            <div className="payment-methods">
                <p>Secure payment with Razorpay</p>
                <div className="payment-icons">
                    <CreditCard /> <span>Cards, UPI, Netbanking</span>
                </div>
            </div>
        </div>
    );
}
