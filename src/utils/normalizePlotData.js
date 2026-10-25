export const normalizePlotData = (apiData) => {
  const item = apiData[0];

  const isPlotLayout = item.rows[0]?.plotno !== null;

  if (isPlotLayout) {
    return {
      type: 'PLOT',
      khasraNo: item.khasrano,
      plots: item.rows.map((p) => ({
        id: p.plotno,
        status: p.status.toLowerCase(),
        area: p.payablearea,
        price: p.totalcost,
        facing: p.plotfacing,
      })),
    };
  }

  // future-ready for flat layout
  return { type: 'FLAT', floors: [] };
};
