function plotGraph() {
  const exprInput = document.getElementById("expression").value;
  const expr = exprInput.replace(/\^/g, '**'); // math.js에서 ^ 대신 ** 사용
  const scope = { x: 0 };
  const rootsDiv = document.getElementById("roots");
  rootsDiv.innerHTML = "";

  let parsed;
  try {
      parsed = math.parse(expr);
  } catch (err) {
      alert("수식을 제대로 입력해주세요.");
      return;
  }

  const compiled = parsed.compile();

  // 그래프용 데이터 생성
  const xValues = math.range(-10, 10, 0.1).toArray();
  const yValues = xValues.map(x => {
      scope.x = x;
      try {
          return compiled.evaluate(scope);
      } catch {
          return NaN;
      }
  });

  // Plotly로 그래프 출력
  const data = [{
      x: xValues,
      y: yValues,
      type: "scatter",
      mode: "lines",
      line: { color: "#007bff" }
  }];

  Plotly.newPlot("graph", data, {
      margin: { t: 0 },
      title: "함수 f(x) 그래프"
  });

  // 근 계산: 다항식 계수 추출 후 math.roots 사용
  try {
      const simplified = math.simplify(expr).toString();
      const coeffs = extractCoefficients(simplified);
      if (coeffs.length < 2) {
          rootsDiv.innerHTML = "방정식이 아닙니다.";
          return;
      }

      const roots = math.roots(coeffs);

      const rootList = roots.map(r => {
          if (typeof r === 'number') {
              return `x = ${r.toFixed(4)}`;
          } else if (r.im === 0) {
              return `x = ${r.re.toFixed(4)}`;
          } else {
              const sign = r.im >= 0 ? "+" : "-";
              return `x = ${r.re.toFixed(4)} ${sign} ${Math.abs(r.im).toFixed(4)}i`;
          }
      });

      rootsDiv.innerHTML = `근 (${roots.length}개):<br>` + rootList.join("<br>");
  } catch (e) {
      rootsDiv.innerHTML = "해를 계산할 수 없습니다.";
  }
}

// 다항식 계수 추출 함수 (단항 기준 단순 구문 해석)
function extractCoefficients(expr) {
  const terms = expr.replace(/\s+/g, '').split(/(?=[+-])/);
  let coeffMap = {};
  let maxDegree = 0;

  for (let term of terms) {
      if (term.includes("x")) {
          let coeff = 1;
          let degree = 1;

          // x^n 형태
          if (term.includes("x**")) {
              const parts = term.split("x**");
              coeff = parseFloat(parts[0]) || (parts[0] === '-' ? -1 : 1);
              degree = parseInt(parts[1]);
          } else if (term.includes("x")) {
              const parts = term.split("x");
              coeff = parseFloat(parts[0]) || (parts[0] === '-' ? -1 : 1);
              degree = 1;
          }

          coeffMap[degree] = (coeffMap[degree] || 0) + coeff;
          if (degree > maxDegree) maxDegree = degree;
      } else {
          // 상수항
          const constant = parseFloat(term);
          coeffMap[0] = (coeffMap[0] || 0) + constant;
      }
  }

  let coeffArray = [];
  for (let i = maxDegree; i >= 0; i--) {
      coeffArray.push(coeffMap[i] || 0);
  }

  return coeffArray;
}
