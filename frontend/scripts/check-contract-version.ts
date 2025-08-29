import { API_CONTRACT_VERSION } from '@shared/constants';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function main() {
  const res = await fetch(`${BACKEND_URL}/status`);
  if (!res.ok) {
    throw new Error(`Failed to fetch backend status: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const backendVersion: string = data.contractVersion || '0.0.0';
  const frontendMajor = API_CONTRACT_VERSION.split('.')[0];
  const backendMajor = backendVersion.split('.')[0];
  if (frontendMajor !== backendMajor) {
    throw new Error(
      `API contract major mismatch: frontend ${API_CONTRACT_VERSION} vs backend ${backendVersion}`,
    );
  }
  console.log(
    `API contract version compatible: frontend ${API_CONTRACT_VERSION} / backend ${backendVersion}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
