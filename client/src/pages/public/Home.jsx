import React from 'react';
import PremiumButton from '../../components/PremiumButton';
import Card from '../../components/Card';
import SalesChart from '../../components/SalesChart';
import './Home.css';

const Home = () => {
    return (
        <div className="home-page">
            <section className="hero">
                <div className="container hero-content">
                    <h1>Experience the Soul of <span className="highlight">Indian Art</span></h1>
                    <p>Connecting authentic artisans with art lovers across the globe.</p>
                    <div className="hero-actions">
                        <PremiumButton variant="primary">Explore Marketplace</PremiumButton>
                        <PremiumButton variant="outline">Learn Our Story</PremiumButton>
                    </div>
                </div>
            </section>

            <section className="featured container">
                <h2 className="section-title">Featured Creations</h2>
                <div className="card-grid">
                    <Card
                        title="Madhubani Masterpiece"
                        image="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80"
                    >
                        <p>Traditional hand-painted folk art from the Mithila region.</p>
                    </Card>
                    <Card
                        title="Dhokra Sculpture"
                        image="https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=800&q=80"
                    >
                        <p>Antique bell metal craft using lost-wax casting technique.</p>
                    </Card>
                    <Card
                        title="Blue Pottery Vase"
                        image="https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=800&q=80"
                    >
                        <p>Exquisite Jaipur blue pottery with traditional floral motifs.</p>
                    </Card>
                </div>
            </section>

            <section className="analytics container">
                <h2 className="section-title">Market Insights</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <SalesChart />
                </div>
            </section>
        </div>
    );
};

export default Home;
