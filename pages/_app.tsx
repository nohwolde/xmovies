import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/lib/integration/react";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Store, Persistor } from "../redux/store";
import Navbar from "../components/nav/Navbar";
import Footer from "../components/footer/Footer";

const SITE_DESCRIPTION =
  "Browse trending movies, TV shows and anime, save titles to My List and pick up where you left off.";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={Store}>
      <PersistGate loading={null} persistor={Persistor}>
        <Head>
          <title>NMOVIES - Watch Movies & TV Shows Online</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#0b0b0d" />
          <meta key="description" name="description" content={SITE_DESCRIPTION} />
          <meta key="og:title" property="og:title" content="NMOVIES" />
          <meta key="og:description" property="og:description" content={SITE_DESCRIPTION} />
          <meta property="og:site_name" content="NMOVIES" />
          <meta key="og:type" property="og:type" content="website" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
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
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
