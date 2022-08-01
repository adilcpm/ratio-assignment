import type { NextPage } from "next";
import Head from "next/head";
import { HomeView } from "../views";

const Home: NextPage = (props) => {
  return (
    <div>
      <Head>
        <title>Farm and Stake from Adi</title>
        <meta
          name="description"
          content="farm stake by adi"
        />
      </Head>
      <HomeView />
    </div>
  );
};

export default Home;
