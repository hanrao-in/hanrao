import pg from "pg";

const hosts = ["2406:da12:557:f800:bf04:fac:922a:385d", "[2406:da12:557:f800:bf04:fac:922a:385d]"];
const password = "bpnDbda16XR3WjU7";
const user = "postgres";
const ports = [5432, 6543];

async function testIPv6() {
  for (const host of hosts) {
    for (const port of ports) {
      const client = new pg.Client({
        host,
        port,
        user,
        password,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
      });

      console.log(`Testing direct IPv6 host ${host} on port ${port}...`);
      try {
        const connectPromise = client.connect();
        connectPromise.catch(() => {});

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 4000);
        });

        await Promise.race([connectPromise, timeoutPromise]);
        console.log(`✔ SUCCESS with host ${host} on port ${port}!`);
        await client.end().catch(() => {});
        break;
      } catch (err: any) {
        console.log(`  Result: ${err.message}`);
      } finally {
        await client.end().catch(() => {});
      }
    }
  }
}

testIPv6();
