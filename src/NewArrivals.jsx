import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ProductCard from "./ProductCard";
import newArrivalsHeader from "./assets/category-banners/newarrivals.webp";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      setLoading(true);
      const now = new Date().toISOString();
      const q = query(
        collection(db, "products"),
        where("approved", "==", true),
        where("newUntil", ">", now)
      );
      const snapshot = await getDocs(q);
      const productList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
      setLoading(false);
    };
    fetchNewArrivals();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-orange-50 text-black">
      <Navbar />
      <img
        src={newArrivalsHeader}
        alt="New Arrivals Header"
        className="w-full h-48 sm:h-64 object-cover shadow"
        style={{ objectPosition: 'center 40%' }}
      />
      <main className="flex-grow max-w-5xl mx-auto px-4 py-10 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🆕 New Arrivals</h1>
          <Link
            to="/add-item"
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="sm:inline hidden">Add New Item</span>
            <span className="inline sm:hidden">+</span>
          </Link>
        </div>
        <p className="mb-8">Check out the latest products added to Rater Joe's!</p>
        {loading ? null : products.length === 0 ? (
          <div className="text-center text-lg">No new arrivals at the moment.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                productId={product.id}
                {...product}
                priority={idx < 6}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 