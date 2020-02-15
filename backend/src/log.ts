export function log (val) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        ...val,
    }));
}
