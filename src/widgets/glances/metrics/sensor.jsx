import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";

import Container from "../components/container";
import Block from "../components/block";

import useWidgetAPI from "utils/proxy/use-widget-api";

const Chart = dynamic(() => import("../components/chart"), { ssr: false });

const defaultPointsLimit = 15;

export default function Component({ service }) {
  const { t } = useTranslation();
  const { widget } = service;
  const { chart, pointsLimit = defaultPointsLimit, version = 3 } = widget;
  const [, sensorName] = widget.metric.split(":");

  const [dataPoints, setDataPoints] = useState(new Array(pointsLimit).fill({ value: 0 }, 0, pointsLimit));

  const { data, error } = useWidgetAPI(service.widget, `${version}/sensors`);

  useEffect(() => {
    if (data && !data.error) {
      const sensorData = data.find((item) => item.label === sensorName);
      if (sensorData) {
        setDataPoints((prevDataPoints) => {
          const newDataPoints = [...prevDataPoints, { value: sensorData.value }];
          if (newDataPoints.length > pointsLimit) {
            newDataPoints.shift();
          }
          return newDataPoints;
        });
      } else {
        data.error = true;
      }
    }
  }, [data, sensorName, pointsLimit]);

  if (error || (data && data.error)) {
    const finalError = error || data.error;
    return <Container error={finalError} widget={widget} />;
  }

  if (!data) {
    return (
      <Container chart={chart}>
        <Block position="bottom-3 left-3">-</Block>
      </Container>
    );
  }

  const sensorData = data.find((item) => item.label === sensorName);

  if (!sensorData) {
    return (
      <Container chart={chart}>
        <Block position="bottom-3 left-3">-</Block>
      </Container>
    );
  }

  return (
    <Container chart={chart}>
      {chart && (
        <Chart
          dataPoints={dataPoints}
          label={[sensorData.unit]}
          max={sensorData.critical}
          formatter={(value) =>
            t("common.number", {
              value,
            })
          }
        />
      )}

      {sensorData && !error && (
        <Block position="bottom-3 left-3">
          {sensorData.warning && chart && (
            <div className="text-xs opacity-50">
              {t("glances.warn")} {sensorData.warning} {sensorData.unit}
            </div>
          )}
          {sensorData.critical && (
            <div className="text-xs opacity-50">
              {t("glances.crit")} {sensorData.critical} {sensorData.unit}
            </div>
          )}
        </Block>
      )}

      <Block position="bottom-3 right-3">
        <div className="text-xs opacity-50">
          {sensorData.warning && !chart && (
            <>
              {t("glances.warn")} {sensorData.warning} {sensorData.unit}
            </>
          )}
        </div>
        <div className="text-xs opacity-75">
          {t("glances.temp")}{" "}
          {t("common.number", {
            value: sensorData.value,
          })}{" "}
          {sensorData.unit}
        </div>
      </Block>
    </Container>
  );
}
