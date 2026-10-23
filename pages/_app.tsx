import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { Provider } from "react-redux";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Store } from "../redux/store";
import Navbar from "../components/nav/Navbar";
import Footer from "../components/footer/Footer";

// No PersistGate: pages render on the server and on first paint without
// waiting for localStorage. Components that read persisted state go through
// hooks/usePersistedState, which reports it as empty until rehydrated.
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={Store}>
      <Head>
        <title>NMOVIES - Watch Movies & TV Shows Online</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0b0b0d" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="62a39000-25ac-4a5e-b0a1-e3a696dd4a3f"
        strategy="afterInteractive"
      />
      <ToastContainer position="top-center" autoClose={4000} transition={Flip} draggablePercent={30} theme="dark" />
      <Navbar />
      <main className="min-h-screen bg-bg text-white">
        <Component {...pageProps} />
      </main>
      <Footer />
    </Provider>
  );
}

export default MyApp;
